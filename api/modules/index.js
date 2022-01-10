const fetch = require('node-fetch')

const isDev = process.env.AZURE_FUNCTIONS_ENVIRONMENT === 'Development'

// /modules?year=${year}&session=${session}
module.exports = async function (context, req) {
    const prod = `https://raw.githubusercontent.com/anucssa/anutimetable/master/public/timetable_${req.query.year}_${req.query.session}.json`
    const TIMETABLE_JSON = isDev ? `http://localhost:3000/timetable_${req.query.year}_${req.query.session}.json` : prod

    let modules
    try {
        modules = await fetch(TIMETABLE_JSON).then(res => res.json())
    } catch (e) {
        const err = "Couldn't load timetable data"
        context.log.error(err+`: ${e}`)
        context.res = {
            status: 503,
            body: err
        }
        context.done()
    }

    const dropClasses = ({classes, id, title, ...module}) => ({ title: title.replace(/_[A-Z][1-9]/, ''), ...module })

    context.res = {
        body: Object.entries(modules).reduce((acc, [key, module]) => ({...acc, [key.split('_')[0]]: dropClasses(module)}),{})
    }
    
    context.done()
}