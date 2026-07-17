import { PageHeader } from '../../components/ui';
import WeekCalendar from '../../components/WeekCalendar';
import { useStore } from '../../lib/store';

export default function CalendarAdmin() {
  const { currentStudio } = useStore();
  return (
    <>
      <PageHeader
        title="Calendario"
        subtitle="Todas las clases programadas de tu estudio"
      />
      <WeekCalendar filter={(s) => s.studioId === currentStudio!.id} />
    </>
  );
}
