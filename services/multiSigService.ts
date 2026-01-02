
export const multiSigService = {
  proposals: [
    { id: 'PROP-001', amount: '0.85', currency: 'ETH', description: 'London Flood Relief Operation', signatures: 1, required: 3, status: 'Pending' },
    { id: 'PROP-002', amount: '25000', currency: 'USDC', description: 'Global Medical Cache Restock', signatures: 3, required: 3, status: 'Approved' }
  ],

  async proposeTransaction(data: any) {
    const prop = {
      id: `PROP-${Math.floor(Math.random() * 1000)}`,
      signatures: 1,
      required: 3,
      status: 'Pending',
      ...data
    };
    this.proposals.push(prop);
    return prop;
  },

  async signTransaction(id: string) {
    const prop = this.proposals.find(p => p.id === id);
    if (prop && prop.signatures < prop.required) {
      prop.signatures++;
      if (prop.signatures === prop.required) {
        prop.status = 'Approved';
      }
    }
    return prop;
  }
};
