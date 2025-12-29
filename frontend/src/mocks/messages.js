export const mockConversations = [
  {
    id: '1',
    participant: {
      name: 'Dr. Sarah Johnson',
      avatar: null,
      online: true,
    },
    lastMessage: 'Thanks for the update on the project progress!',
    timestamp: '10m ago',
    unread: 2,
  },
  {
    id: '2',
    participant: {
      name: 'Michael Chen',
      avatar: null,
      online: false,
    },
    lastMessage: 'Can we schedule a meeting for next week?',
    timestamp: '1h ago',
    unread: 0,
  },
  {
    id: '3',
    participant: {
      name: 'Dr. Robert Williams',
      avatar: null,
      online: true,
    },
    lastMessage: 'The presentation looks great!',
    timestamp: '2h ago',
    unread: 1,
  },
];

export const mockMessages = {
  '1': [
    {
      id: 'm1',
      senderId: 'user',
      senderName: 'You',
      content: 'Hi Dr. Johnson, I wanted to update you on the progress.',
      timestamp: '9:45 AM',
    },
    {
      id: 'm2',
      senderId: 'other',
      senderName: 'Dr. Sarah Johnson',
      content: 'Great! How are things going with the model training?',
      timestamp: '9:50 AM',
    },
    {
      id: 'm3',
      senderId: 'user',
      senderName: 'You',
      content: 'The model is showing promising results. We achieved 94% accuracy on the test set.',
      timestamp: '9:52 AM',
    },
    {
      id: 'm4',
      senderId: 'other',
      senderName: 'Dr. Sarah Johnson',
      content: 'Thanks for the update on the project progress!',
      timestamp: '9:55 AM',
    },
  ],
  '2': [
    {
      id: 'm5',
      senderId: 'other',
      senderName: 'Michael Chen',
      content: 'Hey, do you have time to review the paper draft?',
      timestamp: 'Yesterday',
    },
    {
      id: 'm6',
      senderId: 'user',
      senderName: 'You',
      content: 'Sure! I can take a look this afternoon.',
      timestamp: 'Yesterday',
    },
    {
      id: 'm7',
      senderId: 'other',
      senderName: 'Michael Chen',
      content: 'Can we schedule a meeting for next week?',
      timestamp: '2:30 PM',
    },
  ],
  '3': [
    {
      id: 'm8',
      senderId: 'user',
      senderName: 'You',
      content: 'I finished the presentation slides.',
      timestamp: '11:00 AM',
    },
    {
      id: 'm9',
      senderId: 'other',
      senderName: 'Dr. Robert Williams',
      content: 'The presentation looks great!',
      timestamp: '11:15 AM',
    },
  ],
};
