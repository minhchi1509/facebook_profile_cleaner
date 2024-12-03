import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

class DateUtils {
  static isValidDateInput(input: string) {
    return (
      /^\d{2}\/\d{4}$/.test(input) && dayjs(input, "MM/YYYY", true).isValid()
    );
  }
  static isValidTwoDate(from: string, to: string) {
    if (!this.isValidDateInput(from) || !this.isValidDateInput(to)) {
      return false;
    }
    let startDate = dayjs(from, "MM/YYYY");
    const endDate = dayjs(to, "MM/YYYY");

    if (startDate.isAfter(endDate)) {
      return false;
    }
    return true;
  }

  static stringFormatToDate(input: string) {
    return dayjs(input, "MM/YYYY");
  }
}

export default DateUtils;
