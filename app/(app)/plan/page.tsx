import Link from "next/link";
import { CalendarCheck2, Check, LockKeyhole } from "lucide-react";
import { bootstrapPlan, getActivePlan, getPlanDays } from "@/lib/learning";

const weekday = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default async function PlanPage() {
  await bootstrapPlan();
  const plan = await getActivePlan();
  if (!plan) return null;
  const days = await getPlanDays(plan.id);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());

  return (
    <>
      <div className="page-header">
        <div><div className="eyebrow">4-Week Plan</div><h1>Native Input Foundation</h1><p>A fixed routine with progressive difficulty. Replace content without losing history.</p></div>
        <Link href="/today" className="btn">Open today</Link>
      </div>

      {[1,2,3,4].map(week => {
        const weekDays = days.filter((d:any) => d.week_number === week);
        return (
          <section className="card" key={week} style={{marginBottom:18}}>
            <div className="row-between" style={{marginBottom:14}}>
              <div><div className="eyebrow">Week {week}</div><h2 style={{marginBottom:0}}>{weekDays[0]?.difficulty}</h2></div>
              <span className="tag">{weekDays.filter((d:any)=>d.status === "completed").length}/7 complete</span>
            </div>
            <div className="day-grid">
              {weekDays.map((day:any) => {
                const isToday = day.date === today;
                const checkpoint = day.day_number === 7;
                return (
                  <div key={day.id} className={`day-card ${isToday ? "today" : ""} ${day.status === "completed" ? "completed" : ""}`}>
                    <div className="row-between">
                      <span className="day-number">{weekday[day.day_number-1]} · {day.date.slice(5)}</span>
                      {day.status === "completed" ? <Check size={15} color="#166534"/> : checkpoint ? <CalendarCheck2 size={15}/> : <LockKeyhole size={14}/>}
                    </div>
                    <div className="day-topic">{day.topic}</div>
                    <p className="small" style={{margin:0}}>{day.objective}</p>
                    <div style={{marginTop:12}}><span className={`tag ${day.status === "completed" ? "success" : checkpoint ? "warning" : ""}`}>{day.status === "completed" ? "Completed" : isToday ? "Today" : checkpoint ? "Checkpoint" : "Scheduled"}</span></div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}
