import crypto from "crypto";

// Demo password for all seeded accounts: "pawmunity"
function hash(password, salt) {
  return crypto.scryptSync(password, salt, 32).toString("hex");
}

const img = (id, w = 900) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

const avatar = (seed) =>
  `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(seed)}`;

const personAvatar = (seed) =>
  `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=ffdfbf,c0aede,b6e3f4`;

export function seed() {
  const now = Date.now();
  const salt = "pawmunity-demo-salt";
  const pw = hash("pawmunity", salt);

  const mkUser = (id, username, firstName, lastName, role, petName, av, bio) => ({
    id,
    username,
    firstName,
    lastName,
    role, // owner | vet | pet_seller | product_seller
    petName,
    email: `${username}@pawmunity.demo`,
    passwordHash: pw,
    passwordSalt: salt,
    avatar: av,
    bio: bio || "",
    createdAt: now - 86400000 * 30,
  });

  const users = [
    mkUser("u_luna", "luna_the_cat", "Luna", "Whiskers", "owner", "Luna", avatar("Luna"), "Professional napper 🐱 Morning patrol specialist."),
    mkUser("u_buddy", "buddy_golden", "Buddy", "Barker", "owner", "Buddy", avatar("Buddy"), "Golden retriever living his best life 🐶"),
    mkUser("u_max", "max_the_beagle", "Max", "Howell", "owner", "Max", avatar("MaxDog"), "Beagle nose, knows everything 🐾"),
    mkUser("u_rex", "rex_adventures", "Rex", "Trail", "owner", "Rex", avatar("Rex"), "Hiking with my humans every weekend ⛰️"),
    mkUser("u_coco", "coco_corgi", "Coco", "Lowrider", "owner", "Coco", avatar("Coco"), "Corgi butt appreciation account."),
    mkUser("u_rocky", "rocky_pup", "Rocky", "Stone", "owner", "Rocky", avatar("Rocky"), "Adopted & thriving 🦴"),
    mkUser("u_milo", "milo_meows", "Milo", "Purrington", "owner", "Milo", avatar("Milo"), "Orange cat, zero thoughts, all vibes 🍊"),
    mkUser("u_dolittle", "dr_dolittle", "Doreen", "Little", "vet", null, personAvatar("Dolittle"), "Veterinarian. I talk to the animals 🩺"),
    mkUser("u_waggy", "waggy_tails", "Wanda", "Aggy", "pet_seller", null, personAvatar("Waggy"), "Ethical breeder & adoption advocate."),
    mkUser("u_pawshop", "pawshop_official", "Paw", "Shop", "product_seller", null, personAvatar("PawShop"), "Everything your pet needs, delivered 📦"),
  ];

  const mkPost = (id, userId, image, caption, likes, daysAgo) => ({
    id,
    userId,
    image,
    caption,
    likes,
    createdAt: now - 86400000 * daysAgo,
  });

  const posts = [
    mkPost("p1", "u_luna", img("photo-1574158622682-e40e69881006"), "Morning patrol complete. 🐱", 1245, 0.2),
    mkPost("p2", "u_buddy", img("photo-1552053831-71594a27632d"), "Did someone say W-A-L-K? 🦮", 2890, 0.8),
    mkPost("p3", "u_coco", img("photo-1546975490-e8b92a360b24"), "Short legs, big dreams ✨ #corgi", 3411, 1.4),
    mkPost("p4", "u_milo", img("photo-1514888286974-6c03e2ca1dba"), "Caught mid-zoomies 🍊⚡", 982, 2.1),
    mkPost("p5", "u_rex", img("photo-1558788353-f76d92427f16"), "Summit reached. Treats earned. ⛰️🐾 #adventuredog", 1764, 3),
    mkPost("p6", "u_max", img("photo-1505628346881-b72b27e84530"), "Investigating a very important smell. 🔍", 654, 3.6),
    mkPost("p7", "u_rocky", img("photo-1583511655857-d19b40a7a54e"), "Adoption day anniversary! One year of belly rubs 🎉", 5120, 4.5),
    mkPost("p8", "u_luna", img("photo-1573865526739-10659fec78a5"), "Judging you from my tower. 😼", 1532, 5.2),
    mkPost("p9", "u_buddy", img("photo-1561037404-61cd46aa615b"), "Puppy eyes loading... 🥺", 4203, 6),
    mkPost("p10", "u_milo", img("photo-1495360010541-f48722b34f7d"), "If I fits, I sits. 📦", 2317, 7),
  ];

  const comments = [
    { id: "c1", postId: "p1", userId: "u_buddy", text: "Such dedication! 🫡", createdAt: now - 3600000 * 4 },
    { id: "c2", postId: "p1", userId: "u_milo", text: "The neighborhood is safe again 😹", createdAt: now - 3600000 * 3 },
    { id: "c3", postId: "p2", userId: "u_rex", text: "WALK?? Where?? 👀", createdAt: now - 3600000 * 18 },
    { id: "c4", postId: "p3", userId: "u_luna", text: "Iconic. Simply iconic.", createdAt: now - 3600000 * 30 },
    { id: "c5", postId: "p7", userId: "u_dolittle", text: "Happy gotcha day, Rocky! 🎂", createdAt: now - 3600000 * 100 },
    { id: "c6", postId: "p9", userId: "u_coco", text: "Resistance is futile 🥺", createdAt: now - 3600000 * 130 },
  ];

  const stories = [
    { id: "s1", userId: "u_rex", image: img("photo-1558788353-f76d92427f16", 700) },
    { id: "s2", userId: "u_luna", image: img("photo-1574158622682-e40e69881006", 700) },
    { id: "s3", userId: "u_coco", image: img("photo-1546975490-e8b92a360b24", 700) },
    { id: "s4", userId: "u_max", image: img("photo-1505628346881-b72b27e84530", 700) },
    { id: "s5", userId: "u_buddy", image: img("photo-1552053831-71594a27632d", 700) },
    { id: "s6", userId: "u_rocky", image: img("photo-1583511655857-d19b40a7a54e", 700) },
    { id: "s7", userId: "u_milo", image: img("photo-1514888286974-6c03e2ca1dba", 700) },
  ];

  const reels = [
    {
      id: "r1",
      userId: "u_buddy",
      image: img("photo-1530281700549-e82e7bf110d6", 700),
      caption: "Living my best life! 🐾 #doglife",
      likes: 12500,
      comments: 452,
    },
    {
      id: "r2",
      userId: "u_luna",
      image: img("photo-1519052537078-e6302a4968d4", 700),
      caption: "POV: you opened a can of tuna 🐟 #catreflexes",
      likes: 8900,
      comments: 311,
    },
    {
      id: "r3",
      userId: "u_coco",
      image: img("photo-1612536057832-2ff7ead58194", 700),
      caption: "Corgi sploot compilation 🧡 #sploot",
      likes: 23100,
      comments: 980,
    },
    {
      id: "r4",
      userId: "u_rex",
      image: img("photo-1477884213360-7e9d7dcc1e48", 700),
      caption: "Trail day with the pack ⛰️ #adventuredog",
      likes: 5400,
      comments: 156,
    },
  ];

  const vets = [
    {
      id: "v1",
      name: "Dr. James Chen",
      specialty: "Surgery Specialist",
      clinic: "City Vet",
      fee: 120,
      rating: 4.8,
      reviews: 214,
      distance: 2.1,
      photo: "https://i.pravatar.cc/150?img=12",
      available: true,
      nextSlots: ["09:00", "11:30", "14:00", "16:30"],
    },
    {
      id: "v2",
      name: "Dr. Sarah Miller",
      specialty: "General Practitioner",
      clinic: "Paws & Claws",
      fee: 50,
      rating: 4.9,
      reviews: 489,
      distance: 0.8,
      photo: "https://i.pravatar.cc/150?img=47",
      available: true,
      nextSlots: ["08:30", "10:00", "13:30", "15:00", "17:00"],
    },
    {
      id: "v3",
      name: "Dr. Aisha Patel",
      specialty: "Dermatology",
      clinic: "Healthy Paws Center",
      fee: 85,
      rating: 4.7,
      reviews: 167,
      distance: 3.4,
      photo: "https://i.pravatar.cc/150?img=31",
      available: true,
      nextSlots: ["09:30", "12:00", "15:30"],
    },
    {
      id: "v4",
      name: "Dr. Marco Rossi",
      specialty: "Exotic Animals",
      clinic: "Wild Hearts Clinic",
      fee: 140,
      rating: 4.6,
      reviews: 98,
      distance: 5.2,
      photo: "https://i.pravatar.cc/150?img=59",
      available: false,
      nextSlots: ["10:30", "14:30"],
    },
  ];

  const pets = [
    {
      id: "pet1",
      name: "Bella",
      breed: "Golden Retriever",
      age: "8 weeks",
      stage: "Puppy",
      price: 1200,
      type: "sale",
      image: img("photo-1633722715463-d30f4f325e24", 700),
      sellerId: "u_waggy",
      description: "Playful, vaccinated, and ready for a loving home. Comes with starter kit.",
    },
    {
      id: "pet2",
      name: "Oliver",
      breed: "British Shorthair",
      age: "2 years",
      stage: "Adult",
      price: 150,
      type: "adoption",
      image: img("photo-1513245543132-31f507417b26", 700),
      sellerId: "u_waggy",
      description: "Calm gentleman cat looking for a quiet home. Adoption fee covers vaccinations.",
    },
    {
      id: "pet3",
      name: "Daisy",
      breed: "Beagle",
      age: "12 weeks",
      stage: "Puppy",
      price: 850,
      type: "sale",
      image: img("photo-1505628346881-b72b27e84530", 700),
      sellerId: "u_waggy",
      description: "Curious explorer with the classic beagle howl. Microchipped & dewormed.",
    },
    {
      id: "pet4",
      name: "Smokey",
      breed: "Maine Coon",
      age: "3 years",
      stage: "Adult",
      price: 90,
      type: "adoption",
      image: img("photo-1574158622682-e40e69881006", 700),
      sellerId: "u_waggy",
      description: "Gentle giant rescue. Loves brushing sessions and window watching.",
    },
    {
      id: "pet5",
      name: "Kiwi",
      breed: "Cockatiel",
      age: "1 year",
      stage: "Young",
      price: 220,
      type: "sale",
      image: img("photo-1552728089-57bdde30beb3", 700),
      sellerId: "u_waggy",
      description: "Whistles the first 4 notes of 'Happy Birthday'. Hand-tamed.",
    },
    {
      id: "pet6",
      name: "Thumper",
      breed: "Holland Lop Rabbit",
      age: "6 months",
      stage: "Young",
      price: 60,
      type: "adoption",
      image: img("photo-1585110396000-c9ffd4e4b308", 700),
      sellerId: "u_waggy",
      description: "Litter-trained and loves leafy greens. Indoor home preferred.",
    },
  ];

  const products = [
    {
      id: "pr1",
      name: "Interactive Cat Toy",
      category: "Toys",
      price: 12.99,
      rating: 4.5,
      reviews: 320,
      image: img("photo-1545249390-6bdfa286032f", 700),
      sellerId: "u_pawshop",
      description: "Feather wand with bell — guaranteed zoomies.",
    },
    {
      id: "pr2",
      name: "Luxury Dog Bed",
      category: "Bedding",
      price: 45.0,
      rating: 4.8,
      reviews: 512,
      image: img("photo-1541599540903-216a46ca1dc0", 700),
      sellerId: "u_pawshop",
      description: "Orthopedic memory foam with washable cover. Size M-XL.",
    },
    {
      id: "pr3",
      name: "Premium Kibble 5kg",
      category: "Food",
      price: 29.5,
      rating: 4.7,
      reviews: 1043,
      image: img("photo-1589924691995-400dc9ecc119", 700),
      sellerId: "u_pawshop",
      description: "Grain-free salmon recipe for adult dogs.",
    },
    {
      id: "pr4",
      name: "Adjustable Harness",
      category: "Walking",
      price: 18.75,
      rating: 4.6,
      reviews: 287,
      image: img("photo-1601758228041-f3b2795255f1", 700),
      sellerId: "u_pawshop",
      description: "No-pull design with reflective straps. XS to XL.",
    },
    {
      id: "pr5",
      name: "Cat Scratching Tower",
      category: "Furniture",
      price: 64.99,
      rating: 4.4,
      reviews: 198,
      image: img("photo-1615789591457-74a63395c990", 700),
      sellerId: "u_pawshop",
      description: "3-level sisal tower with hideout and dangle ball.",
    },
    {
      id: "pr6",
      name: "Grooming Kit",
      category: "Care",
      price: 24.0,
      rating: 4.5,
      reviews: 156,
      image: img("photo-1583337130417-3346a1be7dee", 700),
      sellerId: "u_pawshop",
      description: "Brush, nail clippers, and detangling comb in one kit.",
    },
  ];

  const follows = [
    { followerId: "u_luna", followingId: "u_buddy" },
    { followerId: "u_buddy", followingId: "u_luna" },
    { followerId: "u_rex", followingId: "u_waggy" },
  ];

  const conversations = [
    {
      id: "conv1",
      memberIds: ["u_luna", "u_buddy"],
      updatedAt: now - 60000,
    },
    {
      id: "conv2",
      memberIds: ["u_max", "u_buddy"],
      updatedAt: now - 3600000,
    },
  ];

  const messages = [
    { id: "m1", convId: "conv1", senderId: "u_luna", text: "Park meetup tomorrow at 9?", createdAt: now - 7200000 },
    { id: "m2", convId: "conv1", senderId: "u_buddy", text: "Buddy is ALREADY excited 🐕", createdAt: now - 7000000 },
    { id: "m3", convId: "conv1", senderId: "u_luna", text: "See you? · Now", createdAt: now - 60000 },
    { id: "m4", convId: "conv2", senderId: "u_max", text: "Found the best sniffing spot downtown", createdAt: now - 7200000 },
    { id: "m5", convId: "conv2", senderId: "u_buddy", text: "Coordinates. Now. 📍", createdAt: now - 3600000 },
  ];

  return {
    users,
    posts,
    comments,
    stories,
    reels,
    vets,
    pets,
    products,
    follows,
    conversations,
    messages,
    appointments: [],
    orders: [],
    sessions: {},
  };
}
