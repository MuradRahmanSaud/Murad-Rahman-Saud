async function test() {
  const url = "https://drive.google.com/file/d/1ehZ9vczjafTTw0OL4mQRK-VTcW1QwTMQ/view?usp=sharing";
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if(driveMatch) console.log(driveMatch[1]);
}
test();
