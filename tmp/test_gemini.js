async function test() {
  const req = await fetch("http://localhost:3000/api/enhance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "A futuristic city in the clouds" })
  });
  console.log("Status:", req.status);
  const text = await req.text();
  console.log("Response:", text);
}
test();
