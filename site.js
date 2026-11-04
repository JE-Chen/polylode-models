// A model deleted from the site keeps its card until the next share writes this page again: a card whose image
// does not load is taken off once the model's own file answers 404 (not for a network that failed for a moment).
for (const image of document.querySelectorAll("a.card img")) {
  const card = image.closest("a.card");
  const check = () => fetch(`models/${card.dataset.name}/model.json`, { method: "HEAD", cache: "no-store" })
    .then((answer) => { if (answer.status === 404) card.remove(); })
    .catch(() => {});
  if (image.complete && !image.naturalWidth) check();
  else image.addEventListener("error", check);
}

// Inside a Discord Activity (Discord loads this page with ?frame_id=…): Discord's handshake, then the models open
// here, turned and posed on this page; navigating to a model's own page would lose the frame_id the SDK reads.
// Opened anywhere else the cards stay plain links to each model's page.
const app = document.body.dataset.activity;
const params = new URLSearchParams(location.search);
if (app && params.has("frame_id")) {
  // the handshake is not waited for: the page works the same while (or if) it does not finish
  import("./vendor/discord-embedded-app-sdk-2.5.0.js")
    .then(({ DiscordSDK }) => new DiscordSDK(app).ready())
    .catch((failure) => console.warn("Discord SDK", failure));
  const view = document.getElementById("view");
  const viewer = view.querySelector("model-viewer");
  const box = view.querySelector(".poses");
  const pick = document.getElementById("pose");
  viewer.addEventListener("load", () => {
    pick.replaceChildren();
    const names = viewer.availableAnimations;
    box.hidden = !names.length;
    for (const name of names) pick.add(new Option(name, name));
    if (names.length) { viewer.animationName = names[0]; viewer.play(); }
  });
  pick.addEventListener("change", () => { viewer.animationName = pick.value; viewer.currentTime = 0; viewer.play(); });
  for (const card of document.querySelectorAll("a.card")) {
    card.addEventListener("click", (event) => {
      event.preventDefault();
      viewer.src = `models/${card.dataset.name}/model.glb`;
      view.hidden = false;
    });
  }
  document.getElementById("back").addEventListener("click", () => { view.hidden = true; viewer.removeAttribute("src"); });
}
