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
  // poses and expressions (animations named "expression/…") listed apart; one plays at a time
  const faces = view.querySelector(".faces");
  const face = document.getElementById("face");
  const show = (name) => { viewer.animationName = name; viewer.currentTime = 0; viewer.play(); };
  // an expression is played over the pose (the body keeps it; alone, it fell back to the rest pose), weighted to win
  // where both move the face
  let held = "";
  const hold = (name) => {
    if (typeof viewer.appendAnimation !== "function") { show(name || pick.value); return; }
    if (held) viewer.detachAnimation(held, { fade: false });
    held = name;
    if (name) viewer.appendAnimation(name, { weight: 10, fade: false });
  };
  viewer.addEventListener("load", () => {
    held = "";
    pick.replaceChildren();
    face.replaceChildren(new Option("—", ""));
    const names = viewer.availableAnimations;
    const poses = names.filter((name) => !name.startsWith("expression/"));
    const looks = names.filter((name) => name.startsWith("expression/"));
    box.hidden = !poses.length;
    faces.hidden = !looks.length;
    for (const name of poses) pick.add(new Option(name, name));
    for (const name of looks) face.add(new Option(name.slice("expression/".length), name));
    if (poses.length) show(poses[0]);
  });
  pick.addEventListener("change", () => { show(pick.value); hold(face.value); });
  face.addEventListener("change", () => hold(face.value));
  for (const card of document.querySelectorAll("a.card")) {
    card.addEventListener("click", (event) => {
      event.preventDefault();
      viewer.src = `models/${card.dataset.name}/model.glb`;
      view.hidden = false;
    });
  }
  document.getElementById("back").addEventListener("click", () => { view.hidden = true; viewer.removeAttribute("src"); });
  // how bright the model is lit (the viewer's exposure), kept from one model to the next
  const light = document.getElementById("light");
  light.addEventListener("input", () => { viewer.exposure = Number(light.value); });
}
