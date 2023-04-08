function removeSubdomain(url) {
  // Remove "http://" or "https://"
  url = url.replace(/^https?:\/\//, "");

  // Extract the domain and TLD
  const parts = url.split(".");

  // If there are more than 2 parts (e.g., subdomain.domain.tld),
  // remove the first part (subdomain)
  if (parts.length > 2) {
    parts.shift();
  }

  // Join the parts back together to form the final URL
  const result = parts.join(".");

  return result;
}
