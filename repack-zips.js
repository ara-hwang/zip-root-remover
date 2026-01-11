const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");

function hasRootFolder(zip) {
  const entries = zip.getEntries();

  const rootFolders = new Set(
    entries.map((entry) => entry.entryName.split("/")[0]).filter(Boolean)
  );

  const hasRoot =
    rootFolders.size === 1 &&
    !entries.some((entry) => !entry.entryName.includes("/"));

  return hasRoot ? Array.from(rootFolders)[0] : null;
}

function repackZipFile(zipPath) {
  console.log(`Processing: ${zipPath}`);

  const originalZip = new AdmZip(zipPath);
  const rootFolder = hasRootFolder(originalZip);

  if (!rootFolder) {
    console.log(`  ✓ No root folder found, skipping`);
    return;
  }

  console.log(`  ✓ Root folder detected: ${rootFolder}`);

  const newZip = new AdmZip();
  const entries = originalZip.getEntries();

  entries.forEach((entry) => {
    let newPath = entry.entryName;

    if (newPath.startsWith(rootFolder + "/")) {
      newPath = newPath.substring(rootFolder.length + 1);
    }

    if (!newPath) return;

    if (entry.isDirectory) {
      newZip.addFile(newPath, Buffer.alloc(0), "", entry.attr);
    } else {
      newZip.addFile(newPath, entry.getData(), "", entry.attr);
    }
  });

  const backupPath = zipPath.replace(/\.zip$/, ".backup.zip");
  fs.renameSync(zipPath, backupPath);
  newZip.writeZip(zipPath);

  console.log(
    `  ✓ Repacked successfully (backup: ${path.basename(backupPath)})`
  );
}

function processAllZips() {
  const currentDir = process.cwd();
  const files = fs.readdirSync(currentDir);

  const zipFiles = files.filter(
    (file) =>
      file.toLowerCase().endsWith(".zip") && !file.endsWith(".backup.zip")
  );

  if (zipFiles.length === 0) {
    console.log("No zip files found in current directory");
    return;
  }

  console.log(`Found ${zipFiles.length} zip file(s)\n`);

  zipFiles.forEach((zipFile) => {
    try {
      repackZipFile(path.join(currentDir, zipFile));
    } catch (error) {
      console.error(`  ✗ Error processing ${zipFile}:`, error);
    }
  });

  console.log("\nDone!");
}

processAllZips();
