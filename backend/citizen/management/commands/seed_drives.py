from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from citizen.models import Drive

class Command(BaseCommand):
    help = "Seeds community drives (4 verified drives and 1 pending drive in Delhi)"

    def handle(self, *args, **options):
        Drive.objects.all().delete()
        now = timezone.now()

        drives_data = [
            {
                "title": "No-Firecracker Pledge & Awareness Walk",
                "type": "Awareness Walk",
                "organizer": "Vayu Seva Collective",
                "verified_organizer": True,
                "description": "Join citizens and student groups for a peaceful walk around Lodhi Garden distributing educational leaflets on firecracker impact and winter smog mitigation.",
                "what_to_bring": ["Walking shoes", "Reusable water bottle", "N95 mask"],
                "participation_options": ["Walk participant", "Leaflet distributor", "Route marshal"],
                "starts_at": now + timedelta(days=5, hours=2),
                "ends_at": now + timedelta(days=5, hours=4),
                "place_name": "Lodhi Garden Gate 1, Lodhi Road, New Delhi",
                "lat": 28.5929,
                "lng": 77.2218,
                "ward": "Lodhi Colony",
                "spots_total": 75,
                "status": "verified",
                "checkin_code": "WALK26",
                "ward_banner": "Ward 56 (Lodhi Colony) has high dust levels this week. Join a drive this weekend!"
            },
            {
                "title": "Biomass & Waste Burning Vigil",
                "type": "Monitoring Drive",
                "organizer": "East Delhi Clean Air Watch",
                "verified_organizer": True,
                "description": "Volunteers will patrol assigned sectors in Anand Vihar to document open leaf and garbage burning incidents, directly notifying local municipal enforcement squads.",
                "what_to_bring": ["Smartphone camera", "N95 mask", "Reflective safety vest"],
                "participation_options": ["Spotter", "Photographer", "Log keeper"],
                "starts_at": now + timedelta(days=6, hours=1),
                "ends_at": now + timedelta(days=6, hours=3),
                "place_name": "Anand Vihar Metro Station Exit 2, Delhi",
                "lat": 28.6476,
                "lng": 77.3158,
                "ward": "Anand Vihar",
                "spots_total": 30,
                "status": "verified",
                "checkin_code": "VIGIL8",
                "ward_banner": None
            },
            {
                "title": "N95 Mask Distribution for Workers",
                "type": "Distribution",
                "organizer": "Swachh Vayu Foundation",
                "verified_organizer": True,
                "description": "Distributing certified N95 masks to sanitation workers, construction laborers, and auto drivers around Connaught Place alongside short lung-health briefings.",
                "what_to_bring": ["Valid ID"],
                "participation_options": ["Mask distribution", "Citizen briefing", "Crowd management"],
                "starts_at": now + timedelta(days=7, hours=4),
                "ends_at": now + timedelta(days=7, hours=7),
                "place_name": "Inner Circle, Connaught Place, New Delhi",
                "lat": 28.6315,
                "lng": 77.2167,
                "ward": "Connaught Place",
                "spots_total": 150,
                "status": "verified",
                "checkin_code": "N95DEL",
                "ward_banner": None
            },
            {
                "title": "Construction Dust Awareness & Water Spray Drive",
                "type": "Awareness Drive",
                "organizer": "Urban Air Action Taskforce",
                "verified_organizer": True,
                "description": "Demonstrating CPCB dust mitigation rules to construction supervisors, promoting anti-smog water sprinklers and tarpaulin coverings across Punjabi Bagh sites.",
                "what_to_bring": ["Dust mask", "Notebook"],
                "participation_options": ["Site liaison", "Pamphlet handler"],
                "starts_at": now + timedelta(days=12, hours=3),
                "ends_at": now + timedelta(days=12, hours=5),
                "place_name": "Club Road, Punjabi Bagh, West Delhi",
                "lat": 28.6738,
                "lng": 77.1306,
                "ward": "Punjabi Bagh",
                "spots_total": 45,
                "status": "verified",
                "checkin_code": "DUST99",
                "ward_banner": None
            },
            {
                "title": "School Clean Air Science Workshop",
                "type": "Workshop",
                "organizer": "Young Eco Champions",
                "verified_organizer": True,
                "description": "Interactive hands-on science workshop teaching middle school students how to read real-time AQI monitors and calibrate low-cost PM2.5 sensors.",
                "what_to_bring": ["Stationery provided"],
                "participation_options": ["Workshop mentor", "Student facilitator"],
                "starts_at": now + timedelta(days=9, hours=4),
                "ends_at": now + timedelta(days=9, hours=6),
                "place_name": "Community Center, Lajpat Nagar III, New Delhi",
                "lat": 28.5677,
                "lng": 77.2427,
                "ward": "Lajpat Nagar",
                "spots_total": 80,
                "status": "verified",
                "checkin_code": "ECOAIR",
                "ward_banner": None
            },
            # Pending drive — MUST NOT appear in the public list
            {
                "title": "Unverified Midnight Demonstration (Pending)",
                "type": "Demonstration",
                "organizer": "Anonymous Group",
                "verified_organizer": False,
                "description": "Unverified drive pending administrative background checks.",
                "what_to_bring": [],
                "participation_options": [],
                "starts_at": now + timedelta(days=14),
                "ends_at": now + timedelta(days=14, hours=2),
                "place_name": "India Gate Circle, New Delhi",
                "lat": 28.6129,
                "lng": 77.2295,
                "ward": "Central Delhi",
                "spots_total": 20,
                "status": "pending",
                "checkin_code": "PEND01",
                "ward_banner": None
            }
        ]

        created_count = 0
        for d in drives_data:
            Drive.objects.create(**d)
            created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} drives (5 verified, 1 pending)"))
