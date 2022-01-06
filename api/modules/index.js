const fetch = require('node-fetch')

const TIMETABLE_JSON = process.env.AZURE_FUNCTIONS_ENVIRONMENT === 'Development' ? 'http://localhost:3000/timetable.json' : 'https://raw.githubusercontent.com/pl4nty/anutimetable/master/public/timetable.json'

// /modules?year=${year}&session=${session}
module.exports = async function (context, req) {
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