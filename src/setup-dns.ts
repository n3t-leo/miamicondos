import dns from 'node:dns'

// force node to keep the ipv6 result
dns.setDefaultResultOrder('verbatim')

console.log('[dns] result order set to verbatim')
