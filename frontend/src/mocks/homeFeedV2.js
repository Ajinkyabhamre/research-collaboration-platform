/**
 * Dummy data for Home Feed V2 (LinkedIn-style)
 * Stevens Institute of Technology research-themed posts
 */

// Mock users (Stevens professors and researchers)
export const mockUsers = {
  prof1: {
    id: 'prof1',
    name: 'Dr. Sarah Chen',
    headline: 'Professor of Computer Science • Stevens Institute of Technology',
    department: 'COMPUTER_SCIENCE',
    avatarUrl: null, // Will use initials
  },
  prof2: {
    id: 'prof2',
    name: 'Dr. Michael Rodriguez',
    headline: 'Associate Professor of Electrical & Computer Engineering • Stevens',
    department: 'ELECTRICAL_AND_COMPUTER_ENGINEERING',
    avatarUrl: null,
  },
  prof3: {
    id: 'prof3',
    name: 'Dr. Emily Thompson',
    headline: 'Assistant Professor of Biomedical Engineering • Stevens Institute',
    department: 'BIOMEDICAL_ENGINEERING',
    avatarUrl: null,
  },
  prof4: {
    id: 'prof4',
    name: 'Dr. James Park',
    headline: 'Professor of Mechanical Engineering • Stevens Institute of Technology',
    department: 'MECHANICAL_ENGINEERING',
    avatarUrl: null,
  },
  prof5: {
    id: 'prof5',
    name: 'Dr. Lisa Martinez',
    headline: 'Associate Professor of Chemical Engineering • Stevens',
    department: 'CHEMICAL_ENGINEERING_AND_MATERIALS_SCIENCE',
    avatarUrl: null,
  },
  student1: {
    id: 'student1',
    name: 'Alex Johnson',
    headline: 'PhD Candidate in Computer Science • Stevens Institute of Technology',
    department: 'COMPUTER_SCIENCE',
    avatarUrl: null,
  },
  student2: {
    id: 'student2',
    name: 'Maria Garcia',
    headline: 'MS Student in Artificial Intelligence • Stevens',
    department: 'COMPUTER_SCIENCE',
    avatarUrl: null,
  },
};

// Mock posts (Stevens research-themed)
export const mockPosts = [
  {
    id: 'post1',
    authorId: 'prof1',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    text: 'Excited to announce our new research project on AI-driven cybersecurity! We are looking for motivated graduate students to join our team. This project focuses on developing machine learning models for real-time threat detection and network security analysis. If you are interested in cutting-edge AI applications in cybersecurity, please reach out.',
    media: null,
    stats: {
      likeCount: 24,
      commentCount: 5,
    },
    viewerState: {
      likedByMe: false,
    },
    comments: [
      {
        id: 'c1',
        authorId: 'student1',
        text: 'This sounds amazing! I would love to learn more about the project.',
        createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'c2',
        authorId: 'prof2',
        text: 'Great initiative, Sarah! Looking forward to collaborating on the security aspects.',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'c3',
        authorId: 'student2',
        text: 'I have experience with deep learning and network security from my coursework. Would this be suitable?',
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
      {
        id: 'c4',
        authorId: 'prof1',
        text: 'Absolutely! Please send me your resume and we can discuss further.',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: 'c5',
        authorId: 'student1',
        text: 'Will send my materials by end of day. Thank you!',
        createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'post2',
    authorId: 'prof3',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    text: 'Incredible results from our neural engineering lab today! Our team successfully demonstrated a new brain-computer interface prototype.',
    media: {
      type: 'image',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800',
          alt: 'Lab equipment and research setup',
        },
      ],
    },
    stats: {
      likeCount: 89,
      commentCount: 12,
    },
    viewerState: {
      likedByMe: true,
    },
    comments: [
      {
        id: 'c6',
        authorId: 'prof4',
        text: 'Fantastic work! This could have huge implications for assistive technology.',
        createdAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'c7',
        authorId: 'student2',
        text: 'Congratulations to the team!',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'post3',
    authorId: 'student1',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    text: 'Just presented my research on quantum algorithms at the Stevens Graduate Research Conference. Thank you to Dr. Chen for mentoring me through this project. The quantum computing research group at Stevens is doing amazing work!',
    media: {
      type: 'image',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=800',
          alt: 'Conference presentation',
        },
        {
          url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
          alt: 'Research poster',
        },
      ],
    },
    stats: {
      likeCount: 45,
      commentCount: 8,
    },
    viewerState: {
      likedByMe: false,
    },
    comments: [
      {
        id: 'c8',
        authorId: 'prof1',
        text: 'So proud of your work, Alex! Excellent presentation.',
        createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'c9',
        authorId: 'student2',
        text: 'Great job! Your poster was one of the best at the conference.',
        createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'c10',
        authorId: 'prof2',
        text: 'Impressive work on the quantum error correction algorithms!',
        createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'post4',
    authorId: 'prof2',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    text: 'Our renewable energy research team has achieved a major breakthrough in solar cell efficiency. We have developed a new perovskite-based material that shows 28% efficiency in laboratory tests - a significant improvement over current commercial panels. This research has the potential to revolutionize affordable clean energy. Special thanks to our talented graduate students and the Department of Energy for funding this work.',
    media: {
      type: 'image',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800',
          alt: 'Solar panel research',
        },
        {
          url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800',
          alt: 'Lab testing equipment',
        },
        {
          url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800',
          alt: 'Research team',
        },
        {
          url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800',
          alt: 'Data analysis',
        },
      ],
    },
    stats: {
      likeCount: 156,
      commentCount: 23,
    },
    viewerState: {
      likedByMe: true,
    },
    comments: [
      {
        id: 'c11',
        authorId: 'prof5',
        text: 'Congratulations! This is groundbreaking work.',
        createdAt: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'c12',
        authorId: 'prof3',
        text: 'Amazing results! Have you considered the scalability challenges?',
        createdAt: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'c13',
        authorId: 'prof2',
        text: 'Yes, we are working on that next. Stay tuned!',
        createdAt: new Date(Date.now() - 45 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'post5',
    authorId: 'prof4',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    text: 'New video showcasing our robotics lab!',
    media: {
      type: 'video',
      video: {
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
      },
    },
    stats: {
      likeCount: 67,
      commentCount: 9,
    },
    viewerState: {
      likedByMe: false,
    },
    comments: [
      {
        id: 'c14',
        authorId: 'student1',
        text: 'The autonomous systems are incredible!',
        createdAt: new Date(Date.now() - 71 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'post6',
    authorId: 'prof5',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    text: 'Excited to share that our paper "Advanced Polymer Synthesis for Drug Delivery Systems" has been accepted to the Journal of Materials Chemistry! This research opens new possibilities for targeted cancer treatments with minimal side effects.',
    media: null,
    stats: {
      likeCount: 92,
      commentCount: 15,
    },
    viewerState: {
      likedByMe: false,
    },
    comments: [
      {
        id: 'c15',
        authorId: 'prof3',
        text: 'Congratulations Lisa! I would love to explore collaboration opportunities.',
        createdAt: new Date(Date.now() - 95 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'c16',
        authorId: 'student2',
        text: 'This is such important work. Congratulations!',
        createdAt: new Date(Date.now() - 94 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'post7',
    authorId: 'student2',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    text: 'Grateful for the opportunity to work on natural language processing research at Stevens. Our team is developing AI models that can better understand context in medical literature.',
    media: {
      type: 'image',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800',
          alt: 'AI research visualization',
        },
      ],
    },
    stats: {
      likeCount: 38,
      commentCount: 4,
    },
    viewerState: {
      likedByMe: true,
    },
    comments: [
      {
        id: 'c17',
        authorId: 'prof1',
        text: 'Keep up the excellent work, Maria!',
        createdAt: new Date(Date.now() - 119 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'post8',
    authorId: 'prof1',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    text: 'Reminder: Applications for the Summer Research Program are now open! We have positions available in AI, cybersecurity, data science, and software engineering. This is a paid 10-week program where you will work closely with faculty on cutting-edge research. Undergraduate and graduate students are welcome to apply. Deadline: March 15th.',
    media: null,
    stats: {
      likeCount: 112,
      commentCount: 28,
    },
    viewerState: {
      likedByMe: false,
    },
    comments: [
      {
        id: 'c18',
        authorId: 'student1',
        text: 'Just submitted my application!',
        createdAt: new Date(Date.now() - 143 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'c19',
        authorId: 'student2',
        text: 'What is the application process like?',
        createdAt: new Date(Date.now() - 142 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'post9',
    authorId: 'prof3',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    text: 'Team photo from our biomedical engineering symposium last week. So proud of everyone!',
    media: {
      type: 'image',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
          alt: 'Team photo at symposium',
        },
        {
          url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
          alt: 'Conference hall',
        },
        {
          url: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800',
          alt: 'Presentation',
        },
      ],
    },
    stats: {
      likeCount: 78,
      commentCount: 11,
    },
    viewerState: {
      likedByMe: true,
    },
    comments: [
      {
        id: 'c20',
        authorId: 'prof4',
        text: 'Looks like a great event!',
        createdAt: new Date(Date.now() - 167 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'post10',
    authorId: 'prof4',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    text: 'Happy to announce that our mechanical engineering lab has been awarded a $2M NSF grant to develop next-generation prosthetic devices with advanced haptic feedback. This 3-year project will involve collaboration with medical professionals and will directly improve quality of life for amputees. We are hiring postdocs and PhD students - please contact me if interested.',
    media: null,
    stats: {
      likeCount: 203,
      commentCount: 31,
    },
    viewerState: {
      likedByMe: true,
    },
    comments: [
      {
        id: 'c21',
        authorId: 'prof3',
        text: 'Fantastic news! This aligns perfectly with our neural interface work.',
        createdAt: new Date(Date.now() - 191 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'c22',
        authorId: 'prof1',
        text: 'Congratulations on the grant!',
        createdAt: new Date(Date.now() - 190 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'c23',
        authorId: 'student1',
        text: 'This is incredible work with real-world impact.',
        createdAt: new Date(Date.now() - 189 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
];

// Helper to get user by ID
export function getUserById(userId) {
  return Object.values(mockUsers).find((user) => user.id === userId);
}

// Helper to get posts with author data populated
export function getPostsWithAuthors() {
  return mockPosts.map((post) => ({
    ...post,
    author: getUserById(post.authorId),
    comments: post.comments.map((comment) => ({
      ...comment,
      author: getUserById(comment.authorId),
    })),
  }));
}
