import { NextResponse } from 'next/server';

const stdioHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>stdio</title>
</head>
<body>
  <div id="output"></div>
  <script>
    // Handle stdio operations
    if (window.parent && window.parent.Module) {
      // This is loaded in an iframe, communicate with parent
      window.addEventListener('message', function(event) {
        if (event.data.type === 'stdout') {
          const output = document.getElementById('output');
          if (output) {
            output.innerHTML += event.data.text + '<br>';
          }
        }
      });
    }
  </script>
</body>
</html>`;

export async function POST() {
  console.log('stdio.html POST request handled');
  return new NextResponse(stdioHtml, { 
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

export async function GET() {
  console.log('stdio.html GET request handled');
  return new NextResponse(stdioHtml, { 
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}