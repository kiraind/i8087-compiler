// states of parser
const IDLE      = 0
const IN_WORD   = 1
const IN_NUMBER = 2

const whitespace_r = /^\s$/
const wordFirstChar_r = /^[A-Za-z_]$/
const wordNextChars_r = /^[A-Za-z_0-9]$/
const numberFirstChar_r = /^[\-0-9]$/
const numberNextChars_r = /^[.0-9]$/
const operatorChar_r = /^[()+\-*/]$/

function parse(expression) {
    const tokens = []

    let state = IDLE
    let currentToken = ''

    for (let i = 0; i < expression.length; i += 1) {
        const currentChar = expression[i]

        if(state === IDLE) {
            if(wordFirstChar_r.test(currentChar)) {
                currentToken = currentChar
                state = IN_WORD
            } else if(numberFirstChar_r.test(currentChar)) {
                currentToken = currentChar
                state = IN_NUMBER
            } else if(operatorChar_r.test(currentChar)) {
                tokens.push(currentChar)
            } else if(!whitespace_r.test(currentChar)) {
                throw new Error(`Неизвестный символ '${currentChar}'`)
            }
        } else if(state === IN_WORD) {
            if(wordNextChars_r.test(currentChar)) {
                currentToken += currentChar
            } else {
                tokens.push(currentToken)

                // re-iterate with idle
                state = IDLE
                i -= 1
            }
        } else if(state === IN_NUMBER) {
            if(numberNextChars_r.test(currentChar)) {
                currentToken += currentChar
            } else {
                tokens.push(currentToken)

                // re-iterate with idle
                state = IDLE
                i -= 1
            }
        }
    }

    return tokens
}

module.exports = parse