// Simple polymorphism example:
// all strategy classes implement the same `select()` method.
class TableSelectionStrategy {
  select(candidateTables, bookedTableIds) {
    return candidateTables.find((candidateTable) => !bookedTableIds.has(String(candidateTable._id)));
  }
}

class SmallestCapacityStrategy extends TableSelectionStrategy {
  select(candidateTables, bookedTableIds) {
    return super.select(candidateTables, bookedTableIds);
  }
}

class LargestCapacityStrategy extends TableSelectionStrategy {
  select(candidateTables, bookedTableIds) {
    const orderedCandidates = [...candidateTables].sort((left, right) => {
      if (right.capacity !== left.capacity) {
        return right.capacity - left.capacity;
      }

      return left.tableNumber - right.tableNumber;
    });

    return super.select(orderedCandidates, bookedTableIds);
  }
}

module.exports = {
  LargestCapacityStrategy,
  SmallestCapacityStrategy,
  TableSelectionStrategy,
};
