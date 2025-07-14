const { createHmac } = require('crypto')

const { compare,hash } = require("bcryptjs")
exports.dohash = (value, saltValue) => {
    const result = hash(value, saltValue)
    return result
}

exports.dohasValidation = (value, hashedValue) => {
    const result = compare(value, hashedValue)
    return result
}

exports.hmacProcess = (value, key) => {
    const result = createHmac('sha256', key).update(value).digest('hex')
    return result
}