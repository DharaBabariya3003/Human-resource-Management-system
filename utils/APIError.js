/**
 * @extends Error
 */
class ExtendableError extends Error {
  constructor({message, errors, status, isPublic, stack,template,oldValues}) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.errors = errors;
    this.status = status;
    this.isPublic = isPublic;
    this.stack = stack;
    this.template = template;
    this.oldValues = oldValues;
  }
}

/**
 * Class representing an API error.
 * @extends ExtendableError
 */
class APIError extends ExtendableError {
  /**
  * Creates an API error.
  * @param {string} message - Error message.
  * @param {number} status - HTTP status code of error.
  * @param {boolean} isPublic - Whether the message should be visible to user or not.
  */
  constructor({message, errors, stack,template,oldValues,status = 500, isPublic = true}) {
    super({message, errors, status,template,oldValues,isPublic, stack});
  }
}

module.exports = APIError;
