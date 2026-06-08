# Historical Analytics

Historical Analytics enables the platform to track and analyze balance trends across multiple patch cycles. It moves the analysis from "What happened today?" to "How has the game evolved over time?".

## Hero Trend Analysis

For any given hero, the system aggregates balance data across a specified range of patches.

### Core Metrics:
*   **Total Buffs/Nerfs Received:** Quantitative count of atomic changes by polarity.
*   **Net Trend Direction:** The rolling average of the hero's Net Impact Score.
*   **Major Reworks Detected:** A timeline of kit reworks (as defined in Change Grouping).
*   **Dimensional Score Trajectory:** A visualization of the hero's **Feature Vector** deltas over time.

### Strategic Questions Answered:
*   *Has Puck been gradually nerfed over the last 18 months?*
*   *Has Axe been receiving consistent power-creep?*
*   *Is Invoker receiving mostly Quality-of-Life (QoL) changes or genuine power buffs?*
*   *Which hero has undergone the most significant identity shift in the last 2 years?*

## Patch-to-Patch Comparison

The system allows for the direct comparison of any two arbitrary patches (e.g., 7.35 vs. 7.42) to identify strategic focus shifts.

### Comparison Dimensions:
*   **Entity Improvement/Decline:** Which heroes gained/lost the most strategic weight between the two points?
*   **Systemic Interaction:** Which game systems (Economy, Map, Roshan) were modified most frequently in that period?
*   **Patch Type Classification:** Was the period hero-focused, item-focused, or system-focused?

## Item Trajectory Analytics

The same analysis framework used for heroes is applied to items to track their strategic viability.

### Analytics Areas:
*   **Power Trends:** Tracking the "Net Score" of core items like Black King Bar or Blink Dagger across years of patches.
*   **Adjustment Frequency:** Identifying items that are most frequently tweaked, indicating they are "Hard to Balance."
*   **Item Role Shift:** Detecting when an item's primary metric (e.g., from Attack Speed to Armor) changes its intended archetype use.
