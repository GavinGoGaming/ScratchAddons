import downloadBlob from "../../libraries/common/cs/download-blob.js";

export default async function ({ addon, console, msg }) {
  const vm = addon.tab.traps.vm;
  const { redux } = addon.tab;

  const username = await addon.auth.fetchUsername();

  await redux.waitForState((state) => state.preview.status.project === "FETCHED");
  const projectAuthor = redux.state.preview.projectInfo.author?.username;

  const isOwn = username === projectAuthor;
  const shared = addon.tab.redux.state.preview.projectInfo.is_published;

  async function download(beginFilenameWithId) {
    const downloadButton = document.querySelector(".sa-download-button");
    downloadButton.classList.add("loading");
    try {
      const project = await vm.saveProjectSb3();
      const title = isOwn ? document.querySelector(".project-title input") : document.querySelector(".project-title");
      const titleStr = isOwn ? title.value : title.innerText;
      const projectId = window.location.pathname.split("/")[2];
      downloadBlob((beginFilenameWithId ? `${projectId} ` : "") + titleStr + ".sb3", project);
    } finally {
      downloadButton.classList.remove("loading");
    }
  }

  const downloadButton = document.createElement("button");
  downloadButton.innerText = msg("download");
  downloadButton.onclick = (e) => {
    download(e.shiftKey);
  };
  downloadButton.classList = "button action-button sa-download-button waiting";
  downloadButton.id = "sa-download-button";

  function addbutton() {
    addon.tab.appendToSharedSpace({
      space: shared ? "afterCopyLinkButton" : "beforeProjectActionButtons",
      element: downloadButton,
      order: shared ? -1 : 1,
    });
  }

  addbutton();

  addon.tab.displayNoneWhileDisabled(downloadButton);

  await redux.waitForState((state) => state.scratchGui.projectState.loadingState.startsWith("SHOWING"));
  downloadButton.classList.remove("waiting");

  while (true) {
    await addon.tab.waitForElement(".flex-row.subactions > .flex-row.action-buttons", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      resizeEvent: true,
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });
    addbutton();
  }
}
