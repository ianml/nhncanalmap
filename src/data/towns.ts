export const townGroups = [
  {
    state: 'Connecticut',
    canal: 'Farmington Canal',
    towns: ['New Haven', 'Hamden', 'Cheshire', 'Southington', 'Plainville', 'Farmington', 'Avon', 'Simsbury', 'Granby'],
  },
  {
    state: 'Massachusetts',
    canal: 'Hampshire & Hampden Canal',
    towns: ['Southwick', 'Westfield', 'Southampton', 'Easthampton', 'Northampton'],
  },
];

export const townPath = (name: string) => `/towns/${name.toLowerCase().replaceAll(' ', '-')}`;
