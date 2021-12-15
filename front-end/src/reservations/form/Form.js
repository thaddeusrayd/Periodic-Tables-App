import React, { useState, useEffect, useCallback } from "react";
import { useHistory } from "react-router-dom";
import { useParams } from "react-router";
import moment from "moment";
import { today } from "../../utils/date-time";
import {
  postReservation,
  updateReservation,
  getReservation,
} from "../../utils/api";
import ErrorAlert from "../../layout/ErrorAlert";

const timeTo24HrFormat = (val) => {
  let converted = moment(val, ["h:mm A"]).format("HH:mm");
  if (converted === "Invalid date") {
    converted = moment(val, ["HH:mm"]).format("HH:mm");
    if (converted === "Invalid date") return val;
  }

  return converted;
};

/**
 * A controlled form used for creating and modifying reservations
 */

function Form({ method }) {
  const { reservation_id } = useParams();
  const [reservationsError, setReservationError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const history = useHistory();

  const initialFormState = {
    first_name: "",
    last_name: "",
    mobile_number: "",
    reservation_date: today(),
    reservation_time: "",
    people: 1,
  };

  const [formData, setFormData] = useState({ ...initialFormState });

  // load reservation details from url param and fill form
  useEffect(() => {
    if (method === "POST") return;

    const abortController = new AbortController();
    setReservationError(null);

    getReservation(reservation_id, abortController.signal)
      .then(setFormData)
      .catch(setReservationError);

    return () => abortController.abort();
  }, [reservation_id, method]);

  const sanitizeReservationTime = () => {
    setFormData((state) => ({
      ...state,
      reservation_time: timeTo24HrFormat(state.reservation_time),
    }));
  };

  const submitNew = useCallback(() => {
    const abortController = new AbortController();
    setReservationError(null);

    postReservation(formData, abortController.signal)
      .then(() => {
        setSubmitting(false);
        history.push(`/dashboard?date=${formData.reservation_date}`);
      })
      .catch((err) => {
        setSubmitting(false);
        setReservationError(err);
      });

    return () => abortController.abort();
  }, [setReservationError, formData, setSubmitting, history]);

  const submitEdit = useCallback(() => {
    const abortController = new AbortController();
    setReservationError(null);

    // removes properties from GET for error free PUT
    const trimmedFormData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      people: formData.people,
      mobile_number: formData.mobile_number,
      reservation_date: formData.reservation_date,
      reservation_time: formData.reservation_time,
    };

    updateReservation(reservation_id, trimmedFormData, abortController.signal)
      .then(() => {
        setSubmitting(false);
        history.push(`/dashboard?date=${formData.reservation_date}`);
      })
      .catch((err) => {
        setSubmitting(false);
        setReservationError(err);
      });

    return () => abortController.abort();
  }, [setReservationError, setSubmitting, history, formData, reservation_id]);

  useEffect(() => {
    if (submitting) {
      method === "POST" ? submitNew() : submitEdit();
    }
  }, [submitting, method, submitEdit, submitNew]);

  const handleChange = ({ target }) => {
    let value = target.value;

    // Fixes issue of *people* changing into a string
    if (target.name === "people" && typeof value === "string") {
      value = +value;
    }

    setFormData({
      ...formData,
      [target.name]: value,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    sanitizeReservationTime();

    setSubmitting(true);
  };

  const handleCancel = (event) => {
    event.preventDefault();
    // cancelling a new reservation while in progress sends user back to previous page.
    history.goBack();
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-auto">
            <div className="form-group form-row">
              <label htmlFor="first_name" className="col-md-4 col-form-label">
                First Name:
              </label>
              <div className="col-8 pt-2">
                <input
                  id="first_name"
                  type="text"
                  name="first_name"
                  className="form-control"
                  onChange={handleChange}
                  value={formData.first_name}
                  required={true}
                />
              </div>
            </div>
            <div className="form-group form-row">
              <label htmlFor="last_name" className="col-md-4 col-form-label">
                Last Name:
              </label>
              <div className="col-8 pt-2">
                <input
                  id="last_name"
                  type="text"
                  name="last_name"
                  className="form-control"
                  onChange={handleChange}
                  value={formData.last_name}
                  required={true}
                />
              </div>
            </div>
            <div className="form-group form-row">
              <label
                htmlFor="mobile_number"
                className="col-md-4 col-form-label"
              >
                Mobile Number:
              </label>
              <div className="col-7 pt-2">
                <input
                  id="mobile_number"
                  type="text"
                  name="mobile_number"
                  className="form-control"
                  onChange={handleChange}
                  value={formData.mobile_number}
                  required={true}
                />
              </div>
            </div>
            <div className="form-group form-row">
              <label
                htmlFor="reservation_date"
                className="col-md-4 col-form-label"
              >
                Reservation Date:
              </label>
              <div className="col-6 pt-2">
                <input
                  id="reservation_date"
                  type="date"
                  name="reservation_date"
                  className="form-control"
                  onChange={handleChange}
                  value={formData.reservation_date}
                  required={true}
                />
              </div>
            </div>
            <div className="form-group form-row">
              <label
                htmlFor="reservation_time"
                className="col-md-4 col-form-label"
              >
                Reservation Time:
              </label>
              <div className="col-6 pt-2">
                <input
                  id="reservation_time"
                  type="text"
                  name="reservation_time"
                  className="form-control"
                  onChange={handleChange}
                  value={formData.reservation_time}
                  required={true}
                />
              </div>
            </div>
            <div className="form-group form-row">
              <label htmlFor="people" className="col-md-4 col-form-label">
                Party Size:
              </label>
              <div className="col-3 pt-2">
                <input
                  id="people"
                  type="number"
                  name="people"
                  className="form-control"
                  onChange={handleChange}
                  required={true}
                  min="1"
                  value={formData.people}
                />
              </div>
            </div>
            <div
              className="btn-toolbar mb-5"
              role="toolbar"
              aria-label="Toolbar with form actions buttons"
            >
              <button
                type="button"
                value="Cancel"
                className="btn btn-secondary mr-5"
                onClick={handleCancel}
              >
                <span className="oi oi-action-undo mr-2" />
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Submit
                <span className="oi oi-check ml-2" />
              </button>
            </div>
            <ErrorAlert error={reservationsError} />
          </div>
        </div>
      </form>
    </>
  );
}

export default Form;
