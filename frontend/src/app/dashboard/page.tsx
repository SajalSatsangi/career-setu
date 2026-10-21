"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CurrentUserError,
  createEducation,
  createSkill,
  deleteEducation,
  deleteSkill,
  fetchEducation,
  fetchCurrentUser,
  fetchSkills,
  updateCurrentUser,
  type EducationRecord,
  type CurrentUser,
  type SkillProficiency,
  type SkillRecord,
} from "@/lib/api/users";
import {
  CoursesError,
  completeCourseActivity,
  enrollInCourse,
  fetchCourses,
  fetchMyCourseEnrollments,
  type Course,
  type CourseEnrollment,
} from "@/lib/api/courses";
import {
  applyToJob,
  fetchJobs,
  fetchMyApplications,
  fetchRecruiterApplications,
  fetchRecruiterJobs,
  JobsError,
  updateApplicationStatus,
  type Job,
  type JobApplication,
  type RecruiterApplication,
  type RecruiterJob,
} from "@/lib/api/jobs";
import {
  fetchMentors,
  fetchMyMentorshipRequests,
  MentoringError,
  requestMentorship,
  type MentorProfile,
  type MentorshipRequest,
} from "@/lib/api/mentoring";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationsError,
  type NotificationRecord,
} from "@/lib/api/notifications";
import "./dashboard.css";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRole(role: string) {
  return role.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [education, setEducation] = useState<EducationRecord[]>([]);
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [isCareerDataLoading, setIsCareerDataLoading] = useState(true);
  const [careerDataMessage, setCareerDataMessage] = useState("");
  const [educationForm, setEducationForm] = useState({
    degree: "",
    institution: "",
    fieldOfStudy: "",
    startYear: "",
    isCurrent: true,
  });
  const [skillName, setSkillName] = useState("");
  const [skillProficiency, setSkillProficiency] = useState<SkillProficiency>("BEGINNER");
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);
  const [coursesMessage, setCoursesMessage] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isJobsLoading, setIsJobsLoading] = useState(true);
  const [jobsMessage, setJobsMessage] = useState("");
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>([]);
  const [isMentoringLoading, setIsMentoringLoading] = useState(true);
  const [mentoringMessage, setMentoringMessage] = useState("");
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [notificationsMessage, setNotificationsMessage] = useState("");
  const [recruiterJobs, setRecruiterJobs] = useState<RecruiterJob[]>([]);
  const [recruiterApplications, setRecruiterApplications] = useState<Record<string, RecruiterApplication[]>>({});

  useEffect(() => {
    const accessToken = sessionStorage.getItem("careerSetuAccessToken");

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    Promise.all([fetchCurrentUser(accessToken), fetchEducation(accessToken), fetchSkills(accessToken)])
      .then(([currentUser, educationRecords, skillRecords]) => {
        setUser(currentUser);
        setEducation(educationRecords);
        setSkills(skillRecords);
      })
      .catch((error: unknown) => {
        if (error instanceof CurrentUserError && [401, 403].includes(error.status)) {
          sessionStorage.removeItem("careerSetuAccessToken");
          sessionStorage.removeItem("careerSetuUser");
          router.replace("/login");
          return;
        }

        setErrorMessage(
          error instanceof CurrentUserError
            ? error.message
            : "We could not load your profile. Please try again.",
        );
      })
      .finally(() => {
        setIsLoading(false);
        setIsCareerDataLoading(false);
      });
  }, [router]);

  useEffect(() => {
    const accessToken = sessionStorage.getItem("careerSetuAccessToken");
    if (!accessToken || !user) return;

    Promise.all([fetchCourses(accessToken), fetchMyCourseEnrollments(accessToken)])
      .then(([courseRecords, enrollmentRecords]) => {
        setCourses(courseRecords);
        setEnrollments(enrollmentRecords);
      })
      .catch((error: unknown) => {
        setCoursesMessage(error instanceof CoursesError ? error.message : "Learning paths are temporarily unavailable.");
      })
      .finally(() => setIsCoursesLoading(false));
  }, [user]);

  useEffect(() => {
    const accessToken = sessionStorage.getItem("careerSetuAccessToken");
    if (!accessToken || !user) return;
    fetchNotifications(accessToken)
      .then(setNotifications)
      .catch((error: unknown) => setNotificationsMessage(error instanceof NotificationsError ? error.message : "Notifications are temporarily unavailable."));
  }, [user]);

  useEffect(() => {
    const accessToken = sessionStorage.getItem("careerSetuAccessToken");
    if (!accessToken || !user || user.role !== "STUDENT") return;

    Promise.all([fetchMentors(accessToken), fetchMyMentorshipRequests(accessToken)])
      .then(([mentorRecords, requestRecords]) => {
        setMentors(mentorRecords);
        setMentorshipRequests(requestRecords);
      })
      .catch((error: unknown) => setMentoringMessage(error instanceof MentoringError ? error.message : "Mentoring is temporarily unavailable."))
      .finally(() => setIsMentoringLoading(false));
  }, [user]);

  useEffect(() => {
    const accessToken = sessionStorage.getItem("careerSetuAccessToken");
    if (!accessToken || !user) return;

    if (user.role === "RECRUITER") {
      fetchRecruiterJobs(accessToken)
        .then(async (ownedJobs) => {
          setRecruiterJobs(ownedJobs);
          const applicationEntries = await Promise.all(ownedJobs.map(async (job) => [job.id, await fetchRecruiterApplications(accessToken, job.id)] as const));
          setRecruiterApplications(Object.fromEntries(applicationEntries));
        })
        .catch((error: unknown) => setJobsMessage(error instanceof JobsError ? error.message : "Recruiter data is temporarily unavailable."))
        .finally(() => setIsJobsLoading(false));
      return;
    }

    Promise.all([fetchJobs(accessToken), fetchMyApplications(accessToken)])
      .then(([jobRecords, applicationRecords]) => {
        setJobs(jobRecords);
        setApplications(applicationRecords);
      })
      .catch((error: unknown) => {
        setJobsMessage(error instanceof JobsError ? error.message : "Opportunities are temporarily unavailable.");
      })
      .finally(() => setIsJobsLoading(false));
  }, [user]);

  function handleLogout() {
    sessionStorage.removeItem("careerSetuAccessToken");
    sessionStorage.removeItem("careerSetuUser");
    router.replace("/login");
  }

  function beginProfileEdit() {
    setNameDraft(user?.name ?? "");
    setProfileMessage("");
    setIsEditingProfile(true);
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const accessToken = sessionStorage.getItem("careerSetuAccessToken");

    if (!accessToken || !nameDraft.trim()) {
      setProfileMessage("Enter your name to continue.");
      return;
    }

    setIsSavingProfile(true);
    setProfileMessage("");

    try {
      const updatedUser = await updateCurrentUser(accessToken, nameDraft);
      setUser(updatedUser);
      sessionStorage.setItem("careerSetuUser", JSON.stringify(updatedUser));
      setIsEditingProfile(false);
      setProfileMessage("Profile updated.");
    } catch (error: unknown) {
      setProfileMessage(
        error instanceof CurrentUserError
          ? error.message
          : "We could not update your profile. Please try again.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleEducationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const accessToken = sessionStorage.getItem("careerSetuAccessToken");
    if (!accessToken) return;

    setCareerDataMessage("");
    try {
      const record = await createEducation(accessToken, {
        ...educationForm,
        startYear: Number(educationForm.startYear),
        endYear: null,
      });
      setEducation((records) => [record, ...records]);
      setEducationForm({ degree: "", institution: "", fieldOfStudy: "", startYear: "", isCurrent: true });
      setCareerDataMessage("Education added.");
    } catch (error: unknown) {
      setCareerDataMessage(error instanceof CurrentUserError ? error.message : "Education could not be added.");
    }
  }

  async function handleSkillSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const accessToken = sessionStorage.getItem("careerSetuAccessToken");
    if (!accessToken || !skillName.trim()) return;

    setCareerDataMessage("");
    try {
      const record = await createSkill(accessToken, { name: skillName, proficiency: skillProficiency });
      setSkills((records) => [...records, record].sort((left, right) => left.name.localeCompare(right.name)));
      setSkillName("");
      setCareerDataMessage("Skill added.");
    } catch (error: unknown) {
      setCareerDataMessage(error instanceof CurrentUserError ? error.message : "Skill could not be added.");
    }
  }

  async function removeEducation(id: string) {
    const accessToken = sessionStorage.getItem("careerSetuAccessToken");
    if (!accessToken) return;
    try {
      await deleteEducation(accessToken, id);
      setEducation((records) => records.filter((record) => record.id !== id));
    } catch (error: unknown) {
      setCareerDataMessage(error instanceof CurrentUserError ? error.message : "Education could not be removed.");
    }
  }

  async function removeSkill(id: string) {
    const accessToken = sessionStorage.getItem("careerSetuAccessToken");
    if (!accessToken) return;
    try {
      await deleteSkill(accessToken, id);
      setSkills((records) => records.filter((record) => record.id !== id));
    } catch (error: unknown) {
      setCareerDataMessage(error instanceof CurrentUserError ? error.message : "Skill could not be removed.");
    }
  }

  async function handleEnroll(courseId: string) {
    const accessToken = sessionStorage.getItem("careerSetuAccessToken");
    if (!accessToken) return;

    try {
      const enrollment = await enrollInCourse(accessToken, courseId);
      setEnrollments((records) => [...records, enrollment]);
      setCoursesMessage("You are enrolled in this learning path.");
    } catch (error: unknown) {
      setCoursesMessage(error instanceof CoursesError ? error.message : "We could not enroll you right now.");
    }
  }

  async function handleCompleteActivity(courseId: string, activityId: string) {
    const accessToken = sessionStorage.getItem("careerSetuAccessToken");
    if (!accessToken) return;

    try {
      const updatedEnrollment = await completeCourseActivity(accessToken, courseId, activityId);
      setEnrollments((records) => records.map((record) => record.course.id === courseId ? updatedEnrollment : record));
      setCoursesMessage("Activity completed. Your progress is updated.");
    } catch (error: unknown) {
      setCoursesMessage(error instanceof CoursesError ? error.message : "We could not update your progress.");
    }
  }

  async function handleApply(jobId: string) {
    const accessToken = sessionStorage.getItem("careerSetuAccessToken");
    if (!accessToken) return;

    try {
      const application = await applyToJob(accessToken, jobId);
      setApplications((records) => [...records, application]);
      setJobsMessage("Application submitted.");
    } catch (error: unknown) {
      setJobsMessage(error instanceof JobsError ? error.message : "We could not submit your application.");
    }
  }

  async function handleMentorshipRequest(mentorId: string) {
    const accessToken = sessionStorage.getItem("careerSetuAccessToken");
    if (!accessToken) return;
    try {
      const request = await requestMentorship(accessToken, mentorId);
      setMentorshipRequests((records) => [...records, request]);
      setMentoringMessage("Mentorship request sent.");
    } catch (error: unknown) {
      setMentoringMessage(error instanceof MentoringError ? error.message : "We could not send the mentorship request.");
    }
  }

  async function handleReadNotification(id: string) {
    const accessToken = sessionStorage.getItem("careerSetuAccessToken");
    if (!accessToken) return;
    try {
      await markNotificationRead(accessToken, id);
      setNotifications((records) => records.map((record) => record.id === id ? { ...record, readAt: new Date().toISOString() } : record));
    } catch (error: unknown) {
      setNotificationsMessage(error instanceof NotificationsError ? error.message : "We could not update notifications.");
    }
  }

  async function handleReadAllNotifications() {
    const accessToken = sessionStorage.getItem("careerSetuAccessToken");
    if (!accessToken) return;
    try {
      await markAllNotificationsRead(accessToken);
      setNotifications((records) => records.map((record) => ({ ...record, readAt: record.readAt ?? new Date().toISOString() })));
    } catch (error: unknown) {
      setNotificationsMessage(error instanceof NotificationsError ? error.message : "We could not update notifications.");
    }
  }

  async function handleApplicationStatus(jobId: string, applicationId: string, status: JobApplication["status"]) {
    const accessToken = sessionStorage.getItem("careerSetuAccessToken");
    if (!accessToken) return;
    try {
      const updated = await updateApplicationStatus(accessToken, jobId, applicationId, status);
      setRecruiterApplications((records) => ({
        ...records,
        [jobId]: records[jobId].map((application) => application.id === applicationId ? { ...application, status: updated.status } : application),
      }));
      setJobsMessage("Application status updated.");
    } catch (error: unknown) {
      setJobsMessage(error instanceof JobsError ? error.message : "We could not update the application.");
    }
  }

  if (isLoading) {
    return (
      <main className="dashboard-page dashboard-state">
        <div className="dashboard-spinner" aria-hidden="true" />
        <p>Loading your CareerSetu workspace...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="dashboard-page dashboard-state">
        <div className="dashboard-state-icon" aria-hidden="true">!</div>
        <h1>We could not load your workspace</h1>
        <p>{errorMessage}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Try again
        </button>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link className="dashboard-brand" href="/" aria-label="CareerSetu home">
          <span className="dashboard-brand-mark" aria-hidden="true">CS</span>
          <span>
            <strong>करियरसेतु</strong>
            <small>CareerSetu</small>
          </span>
        </Link>
        <button className="dashboard-logout" type="button" onClick={handleLogout}>
          Sign out
        </button>
      </header>

      <div className="dashboard-content">
        <section className="dashboard-welcome" aria-labelledby="dashboard-title">
          <div>
            <p className="dashboard-kicker">YOUR CAREER WORKSPACE</p>
            <h1 id="dashboard-title">Welcome back, {user.name.split(" ")[0]}.</h1>
            <p>Keep building the skills and experience that move your career forward.</p>
          </div>
          <div className="dashboard-avatar" aria-hidden="true">{getInitials(user.name)}</div>
        </section>

        <section className="dashboard-notifications" aria-labelledby="notifications-heading">
          <div className="dashboard-panel-heading"><div><p className="dashboard-kicker">INBOX</p><h2 id="notifications-heading">Notifications</h2></div><span>{notifications.filter((notification) => !notification.readAt).length} new</span></div>
          {notifications.length === 0 ? <p className="dashboard-muted">You are all caught up.</p> : <><ul className="dashboard-notification-list">{notifications.slice(0, 5).map((notification) => <li className={notification.readAt ? "dashboard-notification-read" : ""} key={notification.id}><div><strong>{notification.title}</strong><p>{notification.body}</p></div>{notification.readAt ? <span>Read</span> : <button type="button" onClick={() => handleReadNotification(notification.id)}>Mark read</button>}</li>)}</ul><button className="dashboard-read-all" type="button" onClick={handleReadAllNotifications}>Mark all as read</button></>}
          {notificationsMessage && <p className="dashboard-profile-message" role="status">{notificationsMessage}</p>}
        </section>

        <section className="dashboard-grid" aria-label="Career workspace overview">
          <article className="dashboard-card dashboard-card-primary">
            <span className="dashboard-card-number">01</span>
            <h2>Complete your profile</h2>
            <p>Add your education, skills, and projects so CareerSetu can tailor your next steps.</p>
            <button type="button" disabled>Update profile</button>
          </article>
          <article className="dashboard-card">
            <span className="dashboard-card-number">02</span>
            <h2>Explore learning paths</h2>
            <p>Discover focused learning journeys designed around the role you want next.</p>
            <button type="button" disabled>Browse learning</button>
          </article>
          <article className="dashboard-card">
            <span className="dashboard-card-number">03</span>
            <h2>Find opportunities</h2>
            <p>Build momentum with roles and opportunities that match your growing skills.</p>
            <button type="button" disabled>View opportunities</button>
          </article>
        </section>

        <section className="dashboard-profile" aria-labelledby="profile-heading">
          <div>
            <p className="dashboard-kicker">ACCOUNT PROFILE</p>
            <h2 id="profile-heading">Your account</h2>
          </div>
          {isEditingProfile ? (
            <form className="dashboard-profile-form" onSubmit={handleProfileSubmit}>
              <label htmlFor="profile-name">Name</label>
              <input
                id="profile-name"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                minLength={2}
                maxLength={100}
                required
              />
              <div className="dashboard-profile-actions">
                <button type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? "Saving..." : "Save name"}
                </button>
                <button type="button" onClick={() => setIsEditingProfile(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="dashboard-profile-details">
              <dl>
                <div><dt>Name</dt><dd>{user.name}</dd></div>
                <div><dt>Email</dt><dd>{user.email}</dd></div>
                <div><dt>Role</dt><dd>{formatRole(user.role)}</dd></div>
              </dl>
              <button className="dashboard-edit-profile" type="button" onClick={beginProfileEdit}>
                Edit name
              </button>
            </div>
          )}
          {profileMessage && <p className="dashboard-profile-message" role="status">{profileMessage}</p>}
        </section>

        <section className="dashboard-data-grid" aria-label="Education and skills">
          <article className="dashboard-data-panel">
            <div className="dashboard-panel-heading">
              <div><p className="dashboard-kicker">LEARNING HISTORY</p><h2>Education</h2></div>
              <span>{education.length}</span>
            </div>
            {isCareerDataLoading ? <p className="dashboard-muted">Loading education...</p> : education.length === 0 ? <p className="dashboard-muted">No education added yet.</p> : (
              <ul className="dashboard-record-list">
                {education.map((record) => <li key={record.id}><div><strong>{record.degree}</strong><span>{record.institution} · {record.fieldOfStudy}</span><small>{record.startYear} - {record.isCurrent ? "Present" : record.endYear}</small></div><button type="button" onClick={() => removeEducation(record.id)} aria-label={`Remove ${record.degree}`}>Remove</button></li>)}
              </ul>
            )}
            <form className="dashboard-add-form" onSubmit={handleEducationSubmit}>
              <input aria-label="Degree" placeholder="Degree or certification" value={educationForm.degree} onChange={(event) => setEducationForm({ ...educationForm, degree: event.target.value })} required />
              <input aria-label="Institution" placeholder="Institution" value={educationForm.institution} onChange={(event) => setEducationForm({ ...educationForm, institution: event.target.value })} required />
              <input aria-label="Field of study" placeholder="Field of study" value={educationForm.fieldOfStudy} onChange={(event) => setEducationForm({ ...educationForm, fieldOfStudy: event.target.value })} required />
              <input aria-label="Start year" type="number" min="1950" max="2100" placeholder="Start year" value={educationForm.startYear} onChange={(event) => setEducationForm({ ...educationForm, startYear: event.target.value })} required />
              <button type="submit">Add education</button>
            </form>
          </article>

          <article className="dashboard-data-panel">
            <div className="dashboard-panel-heading">
              <div><p className="dashboard-kicker">CAPABILITY MAP</p><h2>Skills</h2></div>
              <span>{skills.length}</span>
            </div>
            {isCareerDataLoading ? <p className="dashboard-muted">Loading skills...</p> : skills.length === 0 ? <p className="dashboard-muted">No skills added yet.</p> : (
              <ul className="dashboard-skill-list">{skills.map((skill) => <li key={skill.id}><span>{skill.name}</span><small>{skill.proficiency.toLowerCase()}</small><button type="button" onClick={() => removeSkill(skill.id)} aria-label={`Remove ${skill.name}`}>×</button></li>)}</ul>
            )}
            <form className="dashboard-skill-form" onSubmit={handleSkillSubmit}>
              <input aria-label="Skill name" placeholder="Add a skill" value={skillName} onChange={(event) => setSkillName(event.target.value)} required />
              <select aria-label="Skill proficiency" value={skillProficiency} onChange={(event) => setSkillProficiency(event.target.value as SkillProficiency)}><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option><option value="EXPERT">Expert</option></select>
              <button type="submit">Add skill</button>
            </form>
          </article>
        </section>
        {careerDataMessage && <p className="dashboard-profile-message" role="status">{careerDataMessage}</p>}

        <section className="dashboard-courses" aria-labelledby="courses-heading">
          <div className="dashboard-panel-heading">
            <div><p className="dashboard-kicker">NEXT STEPS</p><h2 id="courses-heading">Learning paths</h2></div>
            <span>{enrollments.length} active</span>
          </div>
          {isCoursesLoading ? <p className="dashboard-muted">Loading learning paths...</p> : courses.length === 0 ? <p className="dashboard-muted">No published learning paths are available yet.</p> : (
            <div className="dashboard-course-list">
              {courses.map((course) => {
                const enrollment = enrollments.find((record) => record.course.id === course.id);
                return <article className="dashboard-course" key={course.id}><div className="dashboard-course-copy"><span className="dashboard-course-meta">{course.category} · {course.level}</span><h3>{course.title}</h3><p>{course.description}</p>{enrollment && course.activities && course.activities.length > 0 && <ol className="dashboard-activity-list">{course.activities.map((activity) => { const completed = enrollment.completions?.some((completion) => completion.activityId === activity.id); return <li key={activity.id}><div><strong>{activity.position}. {activity.title}</strong><small>{activity.description}</small></div>{completed ? <span className="dashboard-activity-complete">Complete</span> : <button type="button" onClick={() => handleCompleteActivity(course.id, activity.id)}>Mark complete</button>}</li>; })}</ol>}</div>{enrollment ? <span className="dashboard-enrolled">Enrolled · {enrollment.progress}%</span> : <button type="button" onClick={() => handleEnroll(course.id)}>Enroll</button>}</article>;
              })}
            </div>
          )}
          {coursesMessage && <p className="dashboard-profile-message" role="status">{coursesMessage}</p>}
        </section>

        {user.role === "RECRUITER" ? <section className="dashboard-courses dashboard-jobs" aria-labelledby="jobs-heading">
          <div className="dashboard-panel-heading"><div><p className="dashboard-kicker">RECRUITER WORKSPACE</p><h2 id="jobs-heading">Candidate review</h2></div><span>{recruiterJobs.length} jobs</span></div>
          {isJobsLoading ? <p className="dashboard-muted">Loading candidates...</p> : recruiterJobs.length === 0 ? <p className="dashboard-muted">No jobs have been posted yet.</p> : <div className="dashboard-recruiter-list">{recruiterJobs.map((job) => <article className="dashboard-recruiter-job" key={job.id}><div><span className="dashboard-course-meta">{job.companyName} · {job._count.applications} applications</span><h3>{job.title}</h3>{(recruiterApplications[job.id] ?? []).length === 0 ? <p>No applications yet.</p> : <ul>{recruiterApplications[job.id].map((application) => <li key={application.id}><div><strong>{application.student.name}</strong><small>{application.student.email} · {application.student.skills.map((skill) => skill.name).join(" · ") || "No skills listed"}</small></div><select value={application.status} onChange={(event) => handleApplicationStatus(job.id, application.id, event.target.value as JobApplication["status"])} disabled={application.status === "HIRED" || application.status === "REJECTED"}><option value="APPLIED">Applied</option><option value="SHORTLISTED">Shortlisted</option><option value="REJECTED">Rejected</option><option value="HIRED">Hired</option></select></li>)}</ul>}</div></article>)}</div>}
          {jobsMessage && <p className="dashboard-profile-message" role="status">{jobsMessage}</p>}
        </section> : <section className="dashboard-courses dashboard-jobs" aria-labelledby="jobs-heading">
          <div className="dashboard-panel-heading">
            <div><p className="dashboard-kicker">OPPORTUNITIES</p><h2 id="jobs-heading">Jobs that match your direction</h2></div>
            <span>{applications.length} applied</span>
          </div>
          {isJobsLoading ? <p className="dashboard-muted">Loading opportunities...</p> : jobs.length === 0 ? <p className="dashboard-muted">No open opportunities are available yet.</p> : (
            <div className="dashboard-job-list">{jobs.map((job) => { const application = applications.find((record) => record.job.id === job.id); return <article className="dashboard-job" key={job.id}><div><span className="dashboard-course-meta">{job.companyName} · {job.location}</span><h3>{job.title}</h3><p>{job.description}</p><small>{job.employmentType} · {job.requiredSkills.join(" · ")}</small></div>{application ? <span className="dashboard-enrolled dashboard-application-status">{application.status.toLowerCase()}</span> : <button type="button" onClick={() => handleApply(job.id)}>Apply</button>}</article>; })}</div>
          )}
          {jobsMessage && <p className="dashboard-profile-message" role="status">{jobsMessage}</p>}
        </section>}

        {user.role === "STUDENT" && <section className="dashboard-courses dashboard-mentoring" aria-labelledby="mentoring-heading">
          <div className="dashboard-panel-heading"><div><p className="dashboard-kicker">GUIDANCE</p><h2 id="mentoring-heading">Find a mentor</h2></div><span>{mentorshipRequests.length} requests</span></div>
          {isMentoringLoading ? <p className="dashboard-muted">Loading mentors...</p> : mentors.length === 0 ? <p className="dashboard-muted">No mentors are available yet.</p> : <div className="dashboard-mentor-list">{mentors.map((mentor) => { const request = mentorshipRequests.find((item) => item.mentor.id === mentor.userId); return <article className="dashboard-mentor" key={mentor.id}><div><span className="dashboard-course-meta">{mentor.expertise.join(" · ")}</span><h3>{mentor.user.name}</h3><p>{mentor.bio}</p><small>Available: {mentor.availability}</small></div>{request ? <span className="dashboard-enrolled dashboard-application-status">{request.status.toLowerCase()}</span> : <button type="button" onClick={() => handleMentorshipRequest(mentor.userId)}>Request mentor</button>}</article>; })}</div>}
          {mentoringMessage && <p className="dashboard-profile-message" role="status">{mentoringMessage}</p>}
        </section>}
      </div>
    </main>
  );
}