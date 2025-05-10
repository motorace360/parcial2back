const executeWithRetry = async (operation, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await Promise.race([
        operation(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database operation timed out')), 15000)
        )
      ]);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
    }
  }
  throw lastError;
};

module.exports = { executeWithRetry };
