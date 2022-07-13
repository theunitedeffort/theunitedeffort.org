module.exports = (data) => {

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The United Effort Organization</title>
    <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="stylesheet" href="/styles.css">
    <script src="/js/accessibility.js" defer></script>
  </head>
  <body class="page-housing">
    <header>
      <div class="container">  
        <a href="/" class="nav-home" title="Home">
          <img src="/images/ueo-logo.png" class="logo-home"  alt="">
        </a>
        <ul class="navigation">
          <li><a href="/housing/affordable-housing" class="nav-housing">Find Affordable Housing</a></li>
          <li><a href="/public-assistance" class="nav-public-assistance">Public Assistance Programs</a></li>
          <li class="second-row"><a href="/resources" class="nav-resources">Resources</a></li>
          <li class="second-row"><a href="/about" class="nav-about">About Us</a></li>
        </ul>
      </div>
    </header>
    <main>
      <div class="container">
      ${data}
      </div>
    </main>
    <div class="pre-footer">
      <div class="container">
      <h2>Donate</h2>
      <p>
        Donations by check should be made out to<br/>
        "The United Effort Organization, Inc."
      </p>
      <p>
        Mail to:
      </p>
      <address>
        The United Effort Organization, Inc.<br/>
        340 E Middlefield Road<br/>
        Mountain View, CA 94043<br/>
      </address>
      </div>
    </div>
    <footer>
      <div class="container">
       <ul class="navigation">
          <li><a href="javascript:window.print()" class="nav_print">Print this page</a></li>
          <li><a href="/">Home</a></li>
          <li><a href="/housing/affordable-housing">Find Affordable Housing</a></li>
          <li><a href="/public-assistance">Public Assistance Programs</a></li>
          <li><a href="/resources">Resources</a></li>
          <li><a href="/about">About Us</a></li>
          <li><a href="/privacy-policy">Privacy Policy</a></li>
        </ul>
      
        <div class="contact">
          <address>
            <p>
              <a href="mailto:help@theunitedeffort.org">help@theunitedeffort.org</a>
            </p>
            <p>
              <a href="tel:6509969607">650 996 9607</a>
            </p>
            The United Effort Organization, Inc.<br/>
            340 E Middlefield Road<br/>
            Mountain View, CA 94043<br/>
          </address>
          <ul class="social">
            <li>
              <a href="https://twitter.com/theunitedeffort" class="icon" aria-label="Follow us on Twitter">							
                <svg role="img" aria-hidden="true" focusable="false" class="icon ">
                  <use xlink:href="/images/sprites.svg#twitter"></use>
                </svg>
              </a>  
            </li>
            <li>
              <a href="https://instagram.com/theunitedeffort" class="icon" aria-label="Follow us on Instagram">							
                <svg role="img" aria-hidden="true" focusable="false" class="icon">
                  <use xlink:href="/images/sprites.svg#instagram"></use>
                </svg>
              </a>  
            </li>
            <li>
              <a href="https://facebook.com/theunitedeffort" class="icon" aria-label="Follow us on Facebook">							
                <svg role="img" aria-hidden="true" focusable="false" class="icon">
                  <use xlink:href="/images/sprites.svg#facebook"></use>
                </svg>
              </a>  
            </li>
            <li>
              <a href="/feeds" class="icon" aria-label="Subscribe to our content feeds">							
                <svg role="img" aria-hidden="true" focusable="false" class="icon">
                  <use xlink:href="/images/sprites.svg#rss"></use>
                </svg>
              </a>  
            </li>
          </ul>
        </div>
      </div>
   </footer>
  </body>
  </html>`

};
