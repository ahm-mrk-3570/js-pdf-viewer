import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();

const getPDF_btn = document.querySelector(".get-pdf");
const inputPDF = document.querySelector(".open-pdf > input");
const sidebar = document.querySelector(".sidebar");

let pdfDoc = null;
let pageNum = 1;
let pageIsRendering = false;
let pageNumIsPending = null;

getPDF_btn.addEventListener("click", async () => {
  const url = inputPDF.value.trim();

  if (!url) {
    alert("Please enter a PDF URL");
    return;
  }

  document.querySelector(".pdf-container")?.remove();
  document.querySelector(".no-pdf")?.remove();

  const canvas = document.createElement("canvas");
  canvas.classList.add("pdf-container");

  sidebar.insertAdjacentElement("afterend", canvas);

  const ctx = canvas.getContext("2d");
  const scale = 1.5;

  const renderPage = (num) => {
    pageIsRendering = true;

    pdfDoc.getPage(num).then((page) => {
      const viewport = page.getViewport({ scale });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderCtx = {
        canvasContext: ctx,
        viewport,
      };

      page.render(renderCtx).promise.then(() => {
        pageIsRendering = false;

        if (pageNumIsPending !== null) {
          renderPage(pageNumIsPending);
          pageNumIsPending = null;
        }
      });

      document.querySelector(".page-num").textContent = num;
    });
  };

  const queueRenderPage = (num) => {
    if (pageIsRendering) {
      pageNumIsPending = num;
    } else {
      renderPage(num);
    }
  };

  const showPrevPage = () => {
    if (pageNum <= 1) return;

    pageNum--;
    queueRenderPage(pageNum);
  };

  const showNextPage = () => {
    if (pageNum >= pdfDoc.numPages) return;

    pageNum++;
    queueRenderPage(pageNum);
  };

  try {
    pdfDoc = await pdfjsLib.getDocument(url).promise;

    document.querySelector(".page-quantity").textContent = pdfDoc.numPages;

    pageNum = 1;

    renderPage(pageNum);

    document
      .querySelector(".prev-page")
      .addEventListener("click", showPrevPage);

    document
      .querySelector(".next-page")
      .addEventListener("click", showNextPage);
  } catch (err) {
    console.error(err);

    canvas.remove();

    const noPDF = document.createElement("div");
    noPDF.classList.add("no-pdf");

    const p = document.createElement("p");
    p.textContent =
      "There is no PDF here. Please fill the form with a correct link.";

    noPDF.appendChild(p);

    sidebar.insertAdjacentElement("afterend", noPDF);
  }
});
