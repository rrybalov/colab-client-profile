export const tabRoute = (id, tab) => ({ page: 'client', id, sub: 'tab', tab });
export const serviceRoute = (id, sid) => ({ page: 'client', id, sub: 'service', key: sid });
export const providerRoute = (id, name) => ({ page: 'client', id, sub: 'provider', key: name });
