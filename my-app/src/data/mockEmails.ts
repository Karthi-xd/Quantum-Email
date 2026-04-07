import type { Email } from '../types';

export const generateMockEmails = (): Record<string, Email[]> => {
  const inbox: Email[] = [
    {
      id: 1,
      from: 'Nova Systems',
      subject: 'Quantum Key Exchange Initialized',
      preview: 'Your entangled key pair has been successfully generated and is ready for use.',
      time: '09:42 AM',
      read: false,
      body: 'Your entangled key pair has been successfully generated and is ready for use. The quantum state has been preserved across all relay nodes. You may now establish secure communications using the new quantum channels.',
    },
    {
      id: 2,
      from: 'Dr. Aria Chen',
      subject: 'Re: Superposition Protocol',
      preview: 'The wave function collapse was intentional. Let me explain the reasoning.',
      time: '08:15 AM',
      read: true,
      body: 'The wave function collapse was intentional. Let me explain the reasoning behind our decision to observe the qubits before measurement.',
    },
    {
      id: 3,
      from: 'Q-Net Alerts',
      subject: 'Decoherence Warning Detected',
      preview: 'Anomalous interference patterns observed in sector 7 of the relay network.',
      time: 'Yesterday',
      read: false,
      body: 'Anomalous interference patterns observed in sector 7 of the relay network. Recommend immediate investigation.',
    },
    {
      id: 4,
      from: 'Entanglement Lab',
      subject: 'Your Qubit Status Report',
      preview: 'Weekly summary of your quantum communication activity and node health.',
      time: 'Yesterday',
      read: true,
      body: 'Weekly summary of your quantum communication activity and node health metrics.',
    },
  ];

  const sent: Email[] = [
    {
      id: 5,
      from: 'You',
      to: 'Quantum Council',
      subject: 'Encrypted Transmission #4471',
      preview: 'Sending the phase-shifted coordinates as requested by the council.',
      time: '07:30 AM',
      read: true,
      body: 'Sending the phase-shifted coordinates as requested by the council. All transmissions are encrypted.',
    },
    {
      id: 6,
      from: 'You',
      to: 'Node Operator',
      subject: 'Quantum Handshake Request',
      preview: 'Initiating secure tunnel to your node. Please confirm receipt.',
      time: 'Yesterday',
      read: true,
      body: 'Initiating secure tunnel to your node. Please confirm receipt.',
    },
  ];

  const spam: Email[] = [
    {
      id: 7,
      from: 'ClassicalNet Inc.',
      subject: 'You WON a free qubit!!!',
      preview: 'Congratulations! Your classical computer has been selected for an upgrade.',
      time: '3 days ago',
      read: false,
      body: 'Congratulations! Your classical computer has been selected for an upgrade to quantum capabilities.',
    },
    {
      id: 8,
      from: 'Fake Quantum LLC',
      subject: 'Upgrade to 9000-qubit NOW',
      preview: 'Limited time offer! No entanglement required. Act fast.',
      time: '5 days ago',
      read: true,
      body: 'Limited time offer! Upgrade to 9000 qubits now. No entanglement required.',
    },
  ];

  return {
    inbox,
    sent,
    spam,
    all: [...inbox, ...sent, ...spam],
  };
};

export const generateEmailsForAccount = (accountEmail: string): Record<string, Email[]> => {
  const baseEmails = generateMockEmails();
  
  const personalizeEmail = (email: Email): Email => ({
    ...email,
    from: email.from === 'You' ? accountEmail : email.from,
    id: email.id + Date.now(),
  });

  return {
    inbox: baseEmails.inbox.map(personalizeEmail),
    sent: baseEmails.sent.map(personalizeEmail),
    spam: baseEmails.spam.map(personalizeEmail),
    all: baseEmails.all.map(personalizeEmail),
  };
};
