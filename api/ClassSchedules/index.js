const fetch = require('node-fetch');

module.exports = async function (context, req) {
    if (req.query.name && req.query.start && req.query.end) {
        let res = await fetch(`${process.env.REACT_APP_ENDPOINT
            }?ModuleName=${req.query.name
            }&StartTime=${req.query.start
            }&EndTime=${req.query.end}`, {
            headers: {
                'accept': 'application/json',
                'authorization': `Basic ${process.env.REACT_APP_AUTH_KEY}`,
                'x-ibm-client-id': process.env.REACT_APP_AUTH_ID
            }
        })

        if (res.status === 204) {
            context.res.json({body: {}})
        }
        
        if (!res.ok) {
            throw Error()
        } else {
            let body = await res.json()
            context.res.json({body})
        }
    }
};