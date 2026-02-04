import http from "k6/http";
import { check, sleep } from "k6";
import encoding from "k6/encoding";

export const options = {
  vus: 50,
  duration: "30s",
};

const pngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAATUlEQVR4nO3PMQ0AAAgDoJvc6FQ4h1gU7x0J9cWlKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKbXwB0k8C3gY3+ZAAAAAElFTkSuQmCC";

export default function () {
  const health = http.get(`${__ENV.BASE_URL || "http://localhost:8000"}/health`);
  check(health, { "health 200": (r) => r.status === 200 });

  const img = http.file(encoding.b64decode(pngBase64, "std"), "test.png", "image/png");
  const payload = { file: img, hint: "person" };
  const res = http.post(`${__ENV.BASE_URL || "http://localhost:8000"}/api/reverse-search`, payload);
  check(res, { "reverse-search 200|4xx": (r) => r.status === 200 || (r.status >= 400 && r.status < 500) });
  sleep(1);
}
