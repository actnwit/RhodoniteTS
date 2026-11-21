/** A dirty range of table slots [min, max), uploaded at once. */
export class DirtyRange {
  min = Number.POSITIVE_INFINITY;
  max = 0;
  add(begin: number, end: number) {
    if (begin < this.min) {
      this.min = begin;
    }
    if (end > this.max) {
      this.max = end;
    }
  }
  get isEmpty() {
    return this.max <= this.min;
  }
  clear() {
    this.min = Number.POSITIVE_INFINITY;
    this.max = 0;
  }
}
