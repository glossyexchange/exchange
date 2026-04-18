import moment from 'moment';

export const getCurrentTime = (): Date => {
  const myDate = moment.utc().utcOffset('+03:00').toDate();
  return myDate;
};

export const formatLocalDate = (date: Date | string) => {
  return moment(date).utcOffset('+03:00').format('YYYY-MM-DD HH:mm:ss');
};