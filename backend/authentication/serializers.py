from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
from citizen.models import CitizenProfile
from policymaker.models import PolicymakerProfile

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'first_name', 'last_name')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role', 'first_name', 'last_name')

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data.get('role', 'CITIZEN'),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # Create corresponding profile based on role
        if user.role == 'CITIZEN':
            CitizenProfile.objects.create(user=user)
        elif user.role == 'POLICYMAKER':
            PolicymakerProfile.objects.create(user=user)
            
        return user

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Accept email + password instead of username + password."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Rename the username_field to email in the serializer fields
        self.fields['email'] = serializers.EmailField()
        self.fields.pop(self.username_field, None)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise AuthenticationFailed('No account found with this email address.')
        except User.MultipleObjectsReturned:
            user = User.objects.filter(email__iexact=email).first()

        if not user.check_password(password):
            raise AuthenticationFailed('Incorrect password.')

        if not user.is_active:
            raise AuthenticationFailed('This account is inactive.')

        # Inject username so the parent validate() can produce tokens
        attrs[self.username_field] = user.username
        attrs.pop('email', None)
        return super().validate(attrs)

