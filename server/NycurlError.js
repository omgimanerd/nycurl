/**
 * @fileoverview Custom error for logs and Promises
 * @author alvin@omgimanerd.tech (Alvin Lin)
 */

class NycurlError extends Error {
  constructor (data, name) {
    super(data, name)
    this.data = data
    this.name = name
  }
}

module.exports = exports = NycurlError
