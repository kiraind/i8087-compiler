const fs = require('fs')

function getArgs(path) {
    const source = fs.readFileSync(path, 'utf8')

    const [ input, output, expression ] = source.split('\n').map(v => v.split('#')[0].trim())

    const float_variables = {}
    const int_variables   = {}

    input.split(',').map(variable => {
        const [ name, type ] = variable.split(':').map(v => v.trim())

        if(type === 'float') {
            float_variables[name] = true
        } else if(type === 'int') {
            int_variables[name] = true
        } else {
            throw new Error(`Unknown type: '${type}'`)
        }
    })

    return {
        float_variables,
        int_variables,
        output,
        expression,
    }
}

module.exports = getArgs