export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(result.error);
    }

    // Replace the raw request body with Zod's parsed output so downstream
    // handlers receive normalized and validated data.
    req.body = result.data;

    return next();
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return next(result.error);
    }

    // Replace the raw route parameters with Zod's parsed output so downstream
    // handlers receive normalized and validated values.
    req.params = result.data;

    return next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return next(result.error);
    }

    // Store parsed query parameters in res.locals so controllers receive
    // normalized values without mutating Express's request query object.
    res.locals.query = result.data;

    return next();
  };
}
