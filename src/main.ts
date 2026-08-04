import "./styles/main.css";
import { GameApp } from "./app/GameApp";

const root = document.getElementById("app");
if (!root) {
  throw new Error("Missing #app mount element");
}
new GameApp(root);
