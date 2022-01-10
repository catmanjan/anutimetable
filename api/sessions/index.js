module.exports = async function (context, req) {
    context.res = {
        body: {
            2022: ['S1','S2','X1','X2','X3','X4']
        }
    }
    
    context.done()
}