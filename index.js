const fs = require('fs')

const getArgs = require('./getArgs.js')
const parse = require('./parse.js')
const { floatToHex } = require('./utils.js')

// <args>

const path = process.argv[2]

const {
    float_variables,
    int_variables,
    output,
    expression: infix,
} = getArgs( path )

// </args>

const regexp_number = /^-?((\d*\.*\d+)|(\d+))$/

const replacements = {
    'arcsin': x => ['(', 'arctg', '(', '(', 'x', ')', '/', 'sqrt', '(', '1', '-', '(', ...x, ')', '*', '(', ...x, ')', ')', ')', ')'],
    'arccos': x => ['(', '2', '*', 'arctg', '(', 'sqrt', '(', '1', '-', '(', ...x, ')', ')', '/', 'sqrt', '(', '1', '+', '(', ...x, ')', ')', ')', ')'],
    'arcctg': x => ['(', 'arctg', '(', '1', '/', '(', ...x, ')', ')', ')'],
    'ln': x => ['(', '1', 'ylb', '(', ...x, ')', '/', '__FLDL2E', ')'],
    'lg': x => ['(', '1', 'ylb', '(', ...x, ')', '/', '__FLDL2T', ')'],
    'lb': x => ['(', '1', 'ylb', '(', ...x, ')', ')'],
}

const conversion_consts = {
    '__FLDL2E': { command: 'fldl2e', name: 'lb(e)' },
    '__FLDL2T': { command: 'fldl2t', name: 'lb(10)' },
    '__FLDPI': { command: 'fldpi', name: 'pi' },
}

const postfix_fns = {}
const prefix_fns = {
    'sin': 20,
    'cos': 20,
    'tg': 20,
    'arctg': 20,
    'sqrt': 20,
    'abs': 20,
    'minus': 20,
    'round': 20,
    'x2m1': 20,
    'sqr': 20
    // todo
}
const binary_fns = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    'ylb': 4,
    // todo
}

// start

const stack = []
let postfix_symbols = []

const infix_symbols = parse(infix)

for(let i = 0; i < infix_symbols.length; i++) {
    // replace substituted functions
    if(infix_symbols[i] in replacements) {
        const fn = infix_symbols[i]
        i++
        const start_i = i + 1
        
        if(infix_symbols[i] === '(') {
            let level = 1
            while(level > 0) {
                i++
                if(infix_symbols[i] === '(') {
                    level++
                } else if(infix_symbols[i] === ')') {
                    level--
                }
            }
        } else {
            throw new Error(`Отсутствует открывающая скобка после функции '${fn}'`)
        }

        if(start_i == i) {
            throw new Error(`Пустой аргумент у функции '${fn}'`)
        }

        const argument = infix_symbols.slice(start_i, i)
        const replacement = replacements[fn](argument)
        infix_symbols.splice(start_i - 2, 2 + (i - start_i) + 1, ...replacement)
    }
}

// Shunting-yard algorithm https://en.wikipedia.org/wiki/Shunting-yard_algorithm
infix_symbols.forEach(symbol => {
    if(regexp_number.test(symbol) || symbol in postfix_fns || symbol in float_variables || symbol in int_variables || symbol in conversion_consts) {
        postfix_symbols.push(symbol)
    } else if(symbol === '(' || symbol in prefix_fns) {
        stack.push(symbol)
    } else if(symbol === ')') {
        while(true) {
            const popped = stack.pop()

            if(popped === undefined) {
                throw new Error('Неверно поставлен разделитель, либо не согласованы скобки')
            } else if(popped === '(') {
                break
            } else {
                postfix_symbols.push(popped)
            }
        }
    } else if(symbol in binary_fns) {
        if(stack.top() !== undefined)
            while(stack.top() in prefix_fns || binary_fns[stack.top()] >= binary_fns[symbol]) {
                postfix_symbols.push( stack.pop() )
            }

        stack.push( symbol )
    } else {
        throw new Error(`Неизвестный символ '${symbol}'`)
    }
})

while(stack.length > 0) {
    const popped = stack.pop()
    if(popped in binary_fns || popped in prefix_fns || popped in postfix_fns) {
        postfix_symbols.push(popped)
    } else {
        throw new Error(`Не согласованы скобки`)
    }
}

const postfixExpression = postfix_symbols.join(' ')

// --------------------------------------------------------------
const data_history = []
const data_stack = []

const constants = {}
let const_count = 0

const code = ['finit']

postfix_symbols.forEach(symbol => {
    // operands
    if(regexp_number.test(symbol)) {
        const n = parseFloat(symbol)
        if(n === 0) {
            code.push('fldz')
            data_stack.push('0')
        } else if(n === 1) {
            code.push('fld1')
            data_stack.push('1')
        } else {
            const hex = floatToHex(n) + 'h'

            if( ! (hex in constants) ) {
                constants[hex] = { name: 'constant' + (const_count++), value: n }
            }
            
            code.push('fld ' + constants[hex].name)
            data_stack.push(constants[hex].value.toString())
        }
    } else if(symbol in conversion_consts) {
        code.push(conversion_consts[symbol].command)
        data_stack.push(conversion_consts[symbol].name)
    } else if(symbol in int_variables) {
        code.push('fild ' + symbol)
        data_stack.push(symbol)
    } else if(symbol in float_variables) {
        code.push('fld ' + symbol)
        data_stack.push(symbol)
    } else {
    // operators
        if(symbol === '+') {
            code.push('faddp')
            const b = data_stack.pop()
            const a = data_stack.pop()
            data_stack.push(`(${a} + ${b})`)
        } else if(symbol === '-') {
            code.push('fsubp')
            const b = data_stack.pop()
            const a = data_stack.pop()
            data_stack.push(`(${a} - ${b})`)
        } else if(symbol === '*') {
            code.push('fmulp')
            const b = data_stack.pop()
            const a = data_stack.pop()
            data_stack.push(`(${a} * ${b})`)
        } else if(symbol === '/') {
            code.push('fdivp')
            const b = data_stack.pop()
            const a = data_stack.pop()
            data_stack.push(`(${a} / ${b})`)
        } else if(symbol === 'ylb') {
            code.push('fyl2x')
            const b = data_stack.pop()
            const a = data_stack.pop()
            data_stack.push(`(${a} * lb(${b}))`)
        } else if(symbol === 'sin') {
            code.push('fsin')
            const a = data_stack.pop()
            data_stack.push(`sin(${a})`)
        } else if(symbol === 'cos') {
            code.push('fcos')
            const a = data_stack.pop()
            data_stack.push(`sin(${a})`)
        } else if(symbol === 'tg') {
            code.push('fptan\nfincstp')
            const a = data_stack.pop()
            data_stack.push(`tg(${a})`)
        } else if(symbol === 'arctg') {
            code.push('fld1\nfpatan')
            const a = data_stack.pop()
            data_stack.push(`arctg(${a})`)
        } else if(symbol === 'sqrt') {
            code.push('fsqrt')
            const a = data_stack.pop()
            data_stack.push(`sqrt(${a})`)
        } else if(symbol === 'abs') {
            code.push('fabs')
            const a = data_stack.pop()
            data_stack.push(`abs(${a})`)
        } else if(symbol === 'minus') {
            code.push('fchs')
            const a = data_stack.pop()
            data_stack.push(`-${a}`)
        } else if(symbol === 'round') {
            code.push('frndint')
            const a = data_stack.pop()
            data_stack.push(`round(${a})`)
        } else if(symbol === 'x2m1') {
            code.push('f2xm1')
            const a = data_stack.pop()
            data_stack.push(`(x^${a} - 1)`)
        } else if(symbol === 'sqr') {
            code.push('fmul st(0), st(0)')
            const a = data_stack.pop()
            data_stack.push(`${a}^2`)
        }
        // no else for error, b. already implemented
    }

    data_history.push([...data_stack])
})

code.push(`fst ${output}`)

data_history.unshift([])
data_history.unshift([ 'команда', 'st0', 'st1', 'st2', 'st3', 'st4', 'st5', 'st6', 'st7' ])
data_history.push([])

// insert code to first row
for(let i = 0; i < code.length; i += 1) {
    const command = code[i]
    data_history[i + 1].unshift(command)
}

// OUTPUT CODE

let data = '; внешние переменные\n'

for(name in float_variables) {
    data += `Extrn C ${name}:dword\n`
}

for(name in int_variables) {
    data += `Extrn C ${name}:word\n`
}

if(Object.keys(constants).length > 0) {
    data += '; константы\n'
}

for(hex in constants) {
    data += constants[hex].name + ' dd ' + hex + ' ; ' + constants[hex].value + '\n'
}

// add indentation
data = data.split('\n').map(line => '    ' + line).join('\n')

const procedureName = 'calc'
const asmModule = `.model small, C ; модель сегментации памяти 'small'
.stack 100h  ; выделение памяти на стек
.486

.data ; начало описания сегмента данных
${data}
.code  ; начало описания сегмента кода

public C ${procedureName}
${procedureName} proc
    ; вычисление выражения: ${infix_symbols.join('')}
    ; с помощью постфиксного выражения: ${postfixExpression}

${/* with indent */ code.map(line => '    ' + line).join('\n')}

    ret
${procedureName} endp
end`

fs.writeFileSync('module.asm', asmModule, 'utf8')

// OUTPUT STACK TABLE

let table = ''

data_history.forEach(row => table += row.join('; ') + '\n')

fs.writeFileSync('stack.csv', table, 'utf8')