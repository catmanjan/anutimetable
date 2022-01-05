module.exports = async function (context, req) {
    context.res = {
        body: {
            2021: ['S2'],
            2022: ['S1']
        }
    }
    
    context.done()
}