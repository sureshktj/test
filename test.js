 if (type === 1) {
      const currentUtcDate = new Date().toISOString().split("T")[0];
      const staticValue = [
        6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0,
        1, 2, 3, 4, 5,
      ];
      const sql = `
        WITH hourly_counts AS (
          SELECT
            date_part('hour', event.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') AS hour,
            event_type,
            COUNT(*) AS count
          FROM event
          WHERE event.created_at::date = '${currentUtcDate}'
            AND event_type IN (${eventTypes
              .map((type) => `'${type}'`)
              .join(", ")})
          GROUP BY hour, event_type
        ), total_counts AS (
          SELECT COUNT(*) AS count
          FROM event
          WHERE event.created_at::date = '${currentUtcDate}'
        )
        SELECT hc.hour, hc.event_type, hc.count, tc.count AS total_count
        FROM hourly_counts hc
        CROSS JOIN total_counts tc
      `;

      const result = await this.eventRepository.dataSource.execute(sql);
      console.log("🚀 ~ EventController ~ result:", result);

      // Create a template array with zero counts for all event types
      const templateEventData = eventTypes.map((eventType) => ({
        eventType,
        count: 0,
      }));

      // Transform the result to the desired format
      const countsByHour = hoursInDay.map((hour, i) => {
        const formattedHour =
          (hoursInDays[i] % 12 || 12) + (hoursInDays[i] < 12 ? " PM" : " AM");
        const hourData = result
          .filter((row: any) => row.hour === hour)
          .map((row: any) => ({
            eventType: row.event_type,
            count: parseInt(row.count, 10),
          }));
        console.log(
          "🚀 ~ EventController ~ countsByHour ~ hourData:",
          hourData
        );
        const eventDataWithZeroes = templateEventData.map((template) => {
          const existingData = hourData.find(
            (data: any) => data.eventType === template.eventType
          );
          return existingData || template;
        });
        console.log(
          "🚀 ~ EventController ~ eventDataWithZeroes ~ eventDataWithZeroes:",
          eventDataWithZeroes
        );
        return {
          // name: formattedHour,
          name:
            (staticValue[i] % 12 || 12) + (staticValue[i] < 12 ? " PM" : " AM"),
          data: eventDataWithZeroes,
        };
      });

      const totalCount = result.length > 0 ? result[0].total_count : 0;

      return { totalCount, countsByData: countsByHour };
    }
