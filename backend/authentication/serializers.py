from rest_framework import serializers
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
