// Script to remove h-10 classes dynamically
document.addEventListener('DOMContentLoaded', function() {
  // Function to find and remove h-10 class from elements
  function removeH10Classes() {
    // Find all elements with role="tablist"
    const tablists = document.querySelectorAll('[role="tablist"]');
    tablists.forEach(tablist => {
      // Remove h-10 class
      tablist.classList.remove('h-10');
      
      // Add our custom classes
      tablist.classList.add('h-auto');
      tablist.classList.add('min-h-0');
      tablist.classList.add('flex-wrap');
      
      // Also remove any inline styles related to height
      if (tablist.style.height) {
        tablist.style.height = 'auto';
      }
      if (tablist.style.minHeight) {
        tablist.style.minHeight = '0';
      }
    });
    
    // Find all elements with role="tab"
    const tabs = document.querySelectorAll('[role="tab"]');
    tabs.forEach(tab => {
      // Add our custom classes
      tab.classList.add('h-auto');
      tab.classList.add('min-h-0');
      
      // Also remove any inline styles related to height
      if (tab.style.height) {
        tab.style.height = 'auto';
      }
      if (tab.style.minHeight) {
        tab.style.minHeight = '0';
      }
    });
  }
  
  // Run initially
  removeH10Classes();
  
  // Create a MutationObserver to watch for DOM changes
  const observer = new MutationObserver(function(mutations) {
    removeH10Classes();
  });
  
  // Start observing the document body for DOM changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});