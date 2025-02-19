class SpacedRepetition {
    constructor() {
        // Intervals in hours for each level
        this.intervals = [
            4,      // Level 0: 4 hours
            8,      // Level 1: 8 hours
            24,     // Level 2: 1 day
            72,     // Level 3: 3 days
            168,    // Level 4: 1 week
            336,    // Level 5: 2 weeks
            730,    // Level 6: 1 month
            2190    // Level 7: 3 months
        ];
    }

    getNextReviewDate(level) {
        const hours = this.intervals[Math.min(level, this.intervals.length - 1)];
        const nextDate = new Date();
        nextDate.setHours(nextDate.getHours() + hours);
        return nextDate;
    }
}
