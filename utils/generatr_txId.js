const generateTxRef = () => {
    const prefix = 'your-app-prefix'; // Replace with your desired prefix
    const timestamp = Date.now(); // Current timestamp in milliseconds
    const randomString = Math.random().toString(36).substring(2, 8); // Generate a random string
  
    return `${prefix}-${timestamp}-${randomString}`;
  };