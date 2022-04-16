module.exports = (data) => {

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>United Efforts Organization</title>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body class="page-resources">
    <header>
      <div class="container">
        <a href="/" class="nav-home" title="Home">
        <img src="/images/ueo-logo.png" class="logo-home"  alt="">
      </a>
      <ul class="navigation">
        <li><a href="/resources" class="nav-resources">Resources</a></li>
        <li><a href="/public-assistance" class="nav-assistance">Public assistance programs</a></li>
        <li class="second-row"><a href="/mentors" class="nav-mentors">Mentors</a></li>
        <li class="second-row"><a href="/helping" class="nav-help">Ways to help</a></li>
        <li class="second-row"><a href="/about" class="nav-about">About us</a></li>
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
      <h2>Offering and seeking help</h2>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Sint maxime ut quae perspiciatis, iusto minima voluptas magnam explicabo odio perferendis vitae rerum sed exercitationem ratione totam placeat tempore ducimus commodi!
      </p>
      <a href="/helping">
        How to help
      </a>
      </div>
    </div>
    <footer>
      <div class="container">
        <ul class="navigation">
          <li><a href="/">Home</a></li>
          <li><a href="/resources">Resources</a></li>
          <li><a href="/about">About us</a></li>
          <li><a href="/assistance">Guides and assistance</a></li>
          <li><a href="/mentors">Mentors</a></li>
          <li><a href="/helping">Ways to help</a></li>
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
