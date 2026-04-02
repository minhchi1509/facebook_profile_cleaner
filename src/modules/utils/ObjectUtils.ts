type TFindByKeyOptions<T> = {
  data: unknown;
  key: string;
  condition?: (
    candidate: T,
    container: Record<string, unknown>,
  ) => candidate is T;
};

class ObjectUtils {
  private static isObjectRecord = (
    value: unknown,
  ): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null;
  };

  static findByKey = <T>({
    data,
    key,
    condition,
  }: TFindByKeyOptions<T>): T | null => {
    const visited = new WeakSet<object>();

    const recursiveSearch = (node: unknown): T | null => {
      if (!ObjectUtils.isObjectRecord(node)) {
        return null;
      }

      if (visited.has(node)) {
        return null;
      }
      visited.add(node);

      if (Array.isArray(node)) {
        for (const item of node) {
          const found = recursiveSearch(item);
          if (found) {
            return found;
          }
        }
        return null;
      }

      if (key in node) {
        const candidate = node[key] as T;
        if (!condition || condition(candidate, node)) {
          return candidate as T;
        }
      }

      for (const value of Object.values(node)) {
        const found = recursiveSearch(value);
        if (found) {
          return found;
        }
      }

      return null;
    };

    return recursiveSearch(data);
  };
}

export default ObjectUtils;
