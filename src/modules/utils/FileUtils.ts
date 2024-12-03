import path from "path";
import fs from "fs";
import { parse, write } from "fast-csv";

class FileUtils {
  static writeToFile = (absolutePath: string, content: any) => {
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(absolutePath, content);
  };

  static readObjectFromJsonFile = <T>(absolutePath: string) => {
    if (!fs.existsSync(absolutePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(absolutePath, "utf-8")) as T;
  };

  static readCSV = <T>(filePath: string): Promise<T[]> =>
    new Promise((resolve, reject) => {
      const allData: any[] = [];
      fs.createReadStream(filePath)
        .pipe(parse({ headers: true }))
        .on("data", (row) => {
          allData.push(row);
        })
        .on("end", () => {
          resolve(allData);
        })
        .on("error", (error) => {
          reject(error);
        });
    });

  static writeCSV = async (
    filePath: string,
    data: any,
    includeHeader: boolean = true
  ) => {
    if (!fs.existsSync(filePath)) {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    const writeStream = fs.createWriteStream(filePath);
    return new Promise((resolve, reject) => {
      write(data, { headers: includeHeader })
        .pipe(writeStream)
        .on("finish", resolve)
        .on("error", reject);
    });
  };
}

export default FileUtils;
