import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

export async function pickFolder() {
  const plat = process.platform;
  if (plat === "win32") {
    const ps = `
      Add-Type -AssemblyName System.Windows.Forms
      $d = New-Object System.Windows.Forms.FolderBrowserDialog
      $d.Description = 'Pasta AT Analyser'
      $d.ShowNewFolderButton = $true
      $r = $d.ShowDialog()
      if ($r -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $d.SelectedPath }
    `;
    const { stdout } = await exec("powershell", ["-NoProfile", "-STA", "-Command", ps], { windowsHide: false, timeout: 180000 });
    return stdout.trim();
  }
  if (plat === "darwin") {
    const { stdout } = await exec("osascript", ["-e", 'POSIX path of (choose folder with prompt "Pasta AT Analyser")'], { timeout: 180000 });
    return stdout.trim().replace(/\/$/, "");
  }
  try {
    const { stdout } = await exec("zenity", ["--file-selection", "--directory", "--title=Pasta AT Analyser"], { timeout: 180000 });
    return stdout.trim();
  } catch {
    const { stdout } = await exec("kdialog", ["--getexistingdirectory", process.env.HOME || "/"], { timeout: 180000 });
    return stdout.trim();
  }
}
