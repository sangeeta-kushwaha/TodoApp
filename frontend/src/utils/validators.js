const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginForm({ email, password }) {
  const errors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters long.";
  } else if (password.length > 72) {
    errors.password = "Password must be 72 characters or fewer.";
  }

  return errors;
}

export function validateSignupForm({ name, email, password }) {
  const errors = {};
  const trimmedName = name.trim();

  if (!trimmedName) {
    errors.name = "Name is required.";
  } else if (trimmedName.length < 2) {
    errors.name = "Name should be at least 2 characters long.";
  } else if (trimmedName.length > 50) {
    errors.name = "Name must be 50 characters or fewer.";
  }

  Object.assign(errors, validateLoginForm({ email, password }));
  return errors;
}

export function validateTaskForm({ title, description }) {
  const errors = {};
  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();

  if (!trimmedTitle) {
    errors.title = "Title is required.";
  } else if (trimmedTitle.length < 3) {
    errors.title = "Title must be at least 3 characters long.";
  } else if (trimmedTitle.length > 100) {
    errors.title = "Title must be 100 characters or fewer.";
  }

  if (!trimmedDescription) {
    errors.description = "Description is required.";
  } else if (trimmedDescription.length < 3) {
    errors.description = "Description must be at least 3 characters long.";
  } else if (trimmedDescription.length > 500) {
    errors.description = "Description must be 500 characters or fewer.";
  }

  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
